import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Call the existing database function to mark overdue installments
    const { error: overdueError } = await supabase.rpc("update_overdue_installments");

    if (overdueError) {
      console.error("Error updating overdue installments:", overdueError);
      throw overdueError;
    }

    // 2. Count how many were updated
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { count: overdueCount } = await supabase
      .from("installments")
      .select("*", { count: "exact", head: true })
      .eq("status", "Atrasado")
      .lt("due_date", todayStr);

    // 3. Update client statuses for affected clients
    const { data: overdueClients } = await supabase
      .from("installments")
      .select("client_id")
      .eq("status", "Atrasado")
      .lt("due_date", todayStr);

    const uniqueClientIds = [...new Set((overdueClients || []).map(i => i.client_id))];

    let clientsUpdated = 0;
    for (const clientId of uniqueClientIds) {
      const { error: clientError } = await supabase
        .from("clients")
        .update({ status: "Atraso" })
        .eq("id", clientId)
        .eq("status", "Ativo");

      if (!clientError) clientsUpdated++;
    }

    console.log(`Updated ${overdueCount} overdue installments, ${clientsUpdated} client statuses`);

    return new Response(
      JSON.stringify({
        success: true,
        overdue_installments: overdueCount,
        clients_updated: clientsUpdated,
        checked_at: todayStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-overdue:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
