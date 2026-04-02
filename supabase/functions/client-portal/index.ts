import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf || typeof cpf !== "string") {
      return new Response(
        JSON.stringify({ error: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CPF - only digits
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      return new Response(
        JSON.stringify({ error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find client by CPF
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, cpf, whatsapp, email, status, avatar_url")
      .eq("cpf", cleanCpf)
      .is("archived_at", null)
      .maybeSingle();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar dados" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!client) {
      return new Response(
        JSON.stringify({ error: "CPF não encontrado no sistema" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch active contracts
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select("id, capital, interest_rate, installments, installment_value, total_amount, total_profit, start_date, first_due_date, frequency, status")
      .eq("client_id", client.id)
      .in("status", ["Ativo", "Atraso"])
      .order("created_at", { ascending: false });

    if (contractsError) {
      console.error("Error fetching contracts:", contractsError);
    }

    // Fetch pending/overdue installments
    const { data: installments, error: installmentsError } = await supabase
      .from("installments")
      .select("id, contract_id, installment_number, total_installments, due_date, amount_due, amount_paid, fine, status, payment_date")
      .eq("client_id", client.id)
      .in("status", ["Pendente", "Atrasado"])
      .order("due_date", { ascending: true });

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError);
    }

    // Fetch recently paid installments (last 10)
    const { data: paidInstallments, error: paidError } = await supabase
      .from("installments")
      .select("id, contract_id, installment_number, total_installments, due_date, amount_due, amount_paid, fine, status, payment_date")
      .eq("client_id", client.id)
      .eq("status", "Pago")
      .order("payment_date", { ascending: false })
      .limit(10);

    if (paidError) {
      console.error("Error fetching paid installments:", paidError);
    }

    // Get operator's WhatsApp for contact
    const { data: operatorContracts } = await supabase
      .from("contracts")
      .select("operator_id")
      .eq("client_id", client.id)
      .limit(1)
      .maybeSingle();

    let operatorWhatsapp: string | null = null;
    let operatorCompany: string | null = null;

    if (operatorContracts?.operator_id) {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("whatsapp_display_phone, company_name")
        .eq("operator_id", operatorContracts.operator_id)
        .maybeSingle();

      operatorWhatsapp = settings?.whatsapp_display_phone || null;
      operatorCompany = settings?.company_name || null;
    }

    // Calculate summary
    const totalPending = (installments || []).reduce((sum, i) => sum + Number(i.amount_due), 0);
    const overdueCount = (installments || []).filter((i) => i.status === "Atrasado").length;
    const totalOverdue = (installments || [])
      .filter((i) => i.status === "Atrasado")
      .reduce((sum, i) => sum + Number(i.amount_due) + Number(i.fine || 0), 0);

    return new Response(
      JSON.stringify({
        client: {
          id: client.id,
          name: client.name,
          status: client.status,
          avatar_url: client.avatar_url,
        },
        contracts: contracts || [],
        installments: installments || [],
        paidInstallments: paidInstallments || [],
        summary: {
          totalPending,
          overdueCount,
          totalOverdue,
          totalContracts: (contracts || []).length,
          nextDueDate: (installments || [])[0]?.due_date || null,
        },
        operator: {
          whatsapp: operatorWhatsapp,
          company: operatorCompany,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
