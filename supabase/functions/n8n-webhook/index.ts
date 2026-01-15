import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook secret if configured
    const providedSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret && providedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { 
      action, 
      client_ids, 
      tone = "amigavel",
      days_ahead = 0,
      custom_message,
    } = body;

    // Action: get_pending_clients - Get clients with pending installments
    if (action === "get_pending_clients") {
      const { data: installments, error } = await supabase
        .from("installments")
        .select(`
          client_id,
          amount_due,
          due_date,
          status,
          clients!inner(id, name, whatsapp, email, status)
        `)
        .in("status", ["Pendente", "Atrasado"])
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Group by client
      const clientsMap = new Map();
      installments?.forEach((inst: any) => {
        const clientId = inst.client_id;
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: inst.clients.id,
            name: inst.clients.name,
            whatsapp: inst.clients.whatsapp,
            email: inst.clients.email,
            status: inst.clients.status,
            pending_amount: 0,
            pending_installments: 0,
            oldest_due_date: inst.due_date,
          });
        }
        const client = clientsMap.get(clientId);
        client.pending_amount += inst.amount_due;
        client.pending_installments += 1;
        if (inst.due_date < client.oldest_due_date) {
          client.oldest_due_date = inst.due_date;
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          count: clientsMap.size,
          clients: Array.from(clientsMap.values()),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: generate_messages - Generate collection messages for specific clients
    if (action === "generate_messages") {
      if (!client_ids || !Array.isArray(client_ids) || client_ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "client_ids array is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get clients with their pending amounts
      const { data: installments, error } = await supabase
        .from("installments")
        .select(`
          client_id,
          amount_due,
          due_date,
          installment_number,
          total_installments,
          clients!inner(id, name, whatsapp, email)
        `)
        .in("client_id", client_ids)
        .in("status", ["Pendente", "Atrasado"])
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Group by client
      const clientsMap = new Map();
      installments?.forEach((inst: any) => {
        const clientId = inst.client_id;
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: inst.clients.id,
            name: inst.clients.name,
            whatsapp: inst.clients.whatsapp,
            email: inst.clients.email,
            pending_amount: 0,
            next_installment: {
              number: inst.installment_number,
              total: inst.total_installments,
              due_date: inst.due_date,
              amount: inst.amount_due,
            },
          });
        }
        clientsMap.get(clientId).pending_amount += inst.amount_due;
      });

      // Generate messages
      const messages = Array.from(clientsMap.values()).map((client: any) => {
        const formattedAmount = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(client.pending_amount);

        const formattedDate = new Date(client.next_installment.due_date).toLocaleDateString("pt-BR");

        let message: string;
        if (custom_message) {
          message = custom_message
            .replace("{nome}", client.name)
            .replace("{valor}", formattedAmount)
            .replace("{vencimento}", formattedDate)
            .replace("{parcela}", `${client.next_installment.number}/${client.next_installment.total}`);
        } else {
          const toneMessages = {
            amigavel: `Olá ${client.name}! 😊\n\nEspero que esteja bem! Passando para lembrar sobre o pagamento de ${formattedAmount}.\n\nPróximo vencimento: ${formattedDate}\n\nQualquer dúvida, estou à disposição!`,
            formal: `Prezado(a) ${client.name},\n\nInformamos que há um débito pendente de ${formattedAmount}.\n\nVencimento: ${formattedDate}\n\nSolicitamos a regularização.\n\nAtenciosamente.`,
            urgente: `${client.name}, ATENÇÃO!\n\nDébito pendente: ${formattedAmount}\nVencimento: ${formattedDate}\n\nRegularize para evitar encargos adicionais.`,
          };
          message = toneMessages[tone as keyof typeof toneMessages] || toneMessages.amigavel;
        }

        const phone = client.whatsapp?.replace(/\D/g, "") || "";
        
        return {
          client_id: client.id,
          client_name: client.name,
          whatsapp: client.whatsapp,
          whatsapp_clean: phone,
          email: client.email,
          pending_amount: client.pending_amount,
          message,
          whatsapp_link: phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}` : null,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          count: messages.length,
          messages,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: log_sent - Log that messages were sent (for tracking)
    if (action === "log_sent") {
      if (!client_ids || !Array.isArray(client_ids)) {
        return new Response(
          JSON.stringify({ error: "client_ids array is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log activities
      const logs = client_ids.map((clientId: string) => ({
        operator_id: "n8n-automation",
        client_id: clientId,
        type: "automated_message",
        description: "Cobrança automática enviada via n8n",
        metadata: { source: "n8n", tone },
      }));

      // Note: This might fail due to RLS, but it's best effort logging
      await supabase.from("activity_log").insert(logs).throwOnError();

      return new Response(
        JSON.stringify({ success: true, logged: client_ids.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Invalid action",
        available_actions: ["get_pending_clients", "generate_messages", "log_sent"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
