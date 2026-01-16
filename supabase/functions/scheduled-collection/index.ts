import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollectionRule {
  id: string;
  user_id: string;
  name: string;
  trigger_days: number;
  message_template: string;
  tone: string;
  is_active: boolean;
}

interface AIAgentTriggers {
  day1?: boolean;
  day3?: boolean;
  day7?: boolean;
  day15?: boolean;
  day30?: boolean;
}

interface CompanySettings {
  ai_agent_active: boolean | null;
  ai_agent_start_time: string | null;
  ai_agent_end_time: string | null;
  ai_agent_triggers: AIAgentTriggers | null;
}

// Check if current time is within the allowed window
function isWithinTimeWindow(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return true; // If not configured, allow all times

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  return currentTime >= startTime && currentTime <= endTime;
}

// Check if the trigger day is enabled
function isTriggerDayEnabled(triggerDays: number, triggers: AIAgentTriggers | null): boolean {
  if (!triggers) return true; // If not configured, allow all days

  const dayKey = `day${triggerDays}` as keyof AIAgentTriggers;
  return triggers[dayKey] === true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active collection rules
    const { data: rules, error: rulesError } = await supabase
      .from("collection_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError) throw rulesError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: any[] = [];
    const skipped: any[] = [];

    // Group rules by user_id to minimize settings queries
    const rulesByUser = (rules as CollectionRule[]).reduce((acc, rule) => {
      if (!acc[rule.user_id]) acc[rule.user_id] = [];
      acc[rule.user_id].push(rule);
      return acc;
    }, {} as Record<string, CollectionRule[]>);

    for (const [userId, userRules] of Object.entries(rulesByUser)) {
      // Fetch company settings for this user
      const { data: settings, error: settingsError } = await supabase
        .from("company_settings")
        .select("ai_agent_active, ai_agent_start_time, ai_agent_end_time, ai_agent_triggers")
        .eq("operator_id", userId)
        .maybeSingle();

      if (settingsError) {
        console.error(`Error fetching settings for user ${userId}:`, settingsError);
        continue;
      }

      const companySettings = settings as CompanySettings | null;

      // Check if AI agent is active
      if (companySettings?.ai_agent_active === false) {
        console.log(`AI agent is disabled for user ${userId}, skipping`);
        skipped.push({ userId, reason: "agent_disabled" });
        continue;
      }

      // Check if we're within the time window
      if (!isWithinTimeWindow(companySettings?.ai_agent_start_time ?? null, companySettings?.ai_agent_end_time ?? null)) {
        console.log(`Outside time window for user ${userId} (${companySettings?.ai_agent_start_time} - ${companySettings?.ai_agent_end_time})`);
        skipped.push({ 
          userId, 
          reason: "outside_time_window",
          window: `${companySettings?.ai_agent_start_time} - ${companySettings?.ai_agent_end_time}`
        });
        continue;
      }

      for (const rule of userRules) {
        // Check if this trigger day is enabled
        if (!isTriggerDayEnabled(rule.trigger_days, companySettings?.ai_agent_triggers ?? null)) {
          console.log(`Trigger day ${rule.trigger_days} not enabled for user ${userId}`);
          skipped.push({ userId, ruleId: rule.id, reason: `day${rule.trigger_days}_disabled` });
          continue;
        }

        // Calculate target date based on trigger_days
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - rule.trigger_days);
        
        const dateStr = targetDate.toISOString().split('T')[0];

        // Find installments matching this date
        const { data: installments, error: instError } = await supabase
          .from("installments")
          .select(`
            id,
            amount_due,
            due_date,
            contract_id,
            client_id,
            clients!inner (
              name,
              whatsapp
            )
          `)
          .eq("due_date", dateStr)
          .eq("status", "pending")
          .eq("operator_id", userId);

        if (instError) {
          console.error("Error fetching installments:", instError);
          continue;
        }

        for (const inst of (installments as any) || []) {
          const client = inst.clients;
          
          // Format message with variables
          let message = rule.message_template
            .replace(/{nome}/g, client.name)
            .replace(/{valor}/g, inst.amount_due.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
            .replace(/{dias}/g, Math.abs(rule.trigger_days).toString())
            .replace(/{vencimento}/g, new Date(inst.due_date).toLocaleDateString('pt-BR'));

          // Log the collection attempt
          await supabase.from("collection_logs").insert({
            user_id: rule.user_id,
            client_id: inst.client_id,
            installment_id: inst.id,
            rule_id: rule.id,
            message_sent: message,
            channel: "whatsapp",
            status: "sent",
          });

          results.push({
            rule: rule.name,
            client: client.name,
            phone: client.whatsapp,
            message,
            due_date: inst.due_date,
          });
        }
      }
    }

    console.log(`Processed ${results.length} collection messages, skipped ${skipped.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        skipped: skipped.length,
        results,
        skippedDetails: skipped,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in scheduled-collection:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
