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

interface InstallmentWithClient {
  id: string;
  amount: number;
  due_date: string;
  contract_id: string;
  contracts: {
    client_id: string;
    clients: {
      name: string;
      phone: string;
    };
  };
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

    for (const rule of rules as CollectionRule[]) {
      // Calculate target date based on trigger_days
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - rule.trigger_days);
      
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find installments matching this date
      const { data: installments, error: instError } = await supabase
        .from("installments")
        .select(`
          id,
          amount,
          due_date,
          contract_id,
          contracts!inner (
            client_id,
            user_id,
            clients!inner (
              name,
              phone
            )
          )
        `)
        .eq("due_date", dateStr)
        .eq("status", "pending")
        .eq("contracts.user_id", rule.user_id);

      if (instError) {
        console.error("Error fetching installments:", instError);
        continue;
      }

      for (const inst of (installments as any) || []) {
        const client = inst.contracts.clients;
        
        // Format message with variables
        let message = rule.message_template
          .replace(/{nome}/g, client.name)
          .replace(/{valor}/g, inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
          .replace(/{dias}/g, Math.abs(rule.trigger_days).toString())
          .replace(/{vencimento}/g, new Date(inst.due_date).toLocaleDateString('pt-BR'));

        // Log the collection attempt
        await supabase.from("collection_logs").insert({
          user_id: rule.user_id,
          client_id: inst.contracts.client_id,
          installment_id: inst.id,
          rule_id: rule.id,
          message_sent: message,
          channel: "whatsapp",
          status: "sent",
        });

        results.push({
          rule: rule.name,
          client: client.name,
          phone: client.phone,
          message,
          due_date: inst.due_date,
        });
      }
    }

    console.log(`Processed ${results.length} collection messages`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
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
