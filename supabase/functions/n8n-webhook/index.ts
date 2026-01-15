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

    // Action: get_client_info - Consulta dados do cliente pelo WhatsApp (para Agente IA)
    if (action === "get_client_info") {
      const { whatsapp } = body;
      
      if (!whatsapp) {
        return new Response(
          JSON.stringify({ success: false, message: "WhatsApp não informado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Limpar número (pegar últimos 11 dígitos)
      const cleanPhone = whatsapp.replace(/\D/g, "").slice(-11);

      // Buscar cliente pelo WhatsApp
      const { data: clients, error } = await supabase
        .from("clients")
        .select("id, name, status, whatsapp")
        .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
        .limit(1);

      if (error) throw error;

      const client = clients?.[0];

      if (!client) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Cliente não encontrado com este número" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar parcelas pendentes
      const { data: installments } = await supabase
        .from("installments")
        .select("id, installment_number, total_installments, amount_due, due_date, status, fine")
        .eq("client_id", client.id)
        .in("status", ["Pendente", "Atrasado"])
        .order("due_date", { ascending: true });

      const pendingInstallments = installments || [];
      const totalPending = pendingInstallments.reduce(
        (sum, i) => sum + (i.amount_due || 0) + (i.fine || 0), 0
      );

      // Formatar valores para o agente
      const formattedTotal = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalPending);

      const nextDueDate = pendingInstallments[0]?.due_date 
        ? new Date(pendingInstallments[0].due_date).toLocaleDateString("pt-BR")
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          client: {
            name: client.name,
            status: client.status
          },
          resumo: `${client.name} possui ${pendingInstallments.length} parcela(s) pendente(s) totalizando ${formattedTotal}${nextDueDate ? `. Próximo vencimento: ${nextDueDate}` : ""}.`,
          pending_count: pendingInstallments.length,
          total_pending_amount: totalPending,
          total_pending_formatted: formattedTotal,
          next_due_date: pendingInstallments[0]?.due_date || null,
          installments: pendingInstallments.map(i => ({
            number: `${i.installment_number}/${i.total_installments}`,
            amount: i.amount_due,
            fine: i.fine || 0,
            total: (i.amount_due || 0) + (i.fine || 0),
            due_date: i.due_date,
            due_date_formatted: new Date(i.due_date).toLocaleDateString("pt-BR"),
            status: i.status
          }))
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: register_payment_promise - Registra promessa de pagamento
    if (action === "register_payment_promise") {
      const { whatsapp, promise_date, amount, notes } = body;
      
      if (!whatsapp || !promise_date) {
        return new Response(
          JSON.stringify({ success: false, message: "whatsapp e promise_date são obrigatórios" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar cliente
      const cleanPhone = whatsapp.replace(/\D/g, "").slice(-11);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
        .limit(1);

      const client = clients?.[0];
      if (!client) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente não encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Formatar data da promessa
      const formattedPromiseDate = new Date(promise_date).toLocaleDateString("pt-BR");
      const formattedAmount = amount 
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
        : "não especificado";

      // Registrar no activity_log
      await supabase.from("activity_log").insert({
        operator_id: "agente-ia",
        client_id: client.id,
        type: "payment_promise",
        description: `Promessa de pagamento registrada via Agente IA. Data: ${formattedPromiseDate}. Valor: ${formattedAmount}${notes ? `. Obs: ${notes}` : ""}`,
        metadata: { 
          source: "agente-ia", 
          promise_date, 
          amount: amount || null,
          notes: notes || null
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Promessa de pagamento registrada para ${client.name} no dia ${formattedPromiseDate}`,
          client_name: client.name,
          promise_date: formattedPromiseDate,
          amount: formattedAmount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: get_renegotiation_options - Retorna opções de renegociação
    if (action === "get_renegotiation_options") {
      const { whatsapp } = body;
      
      if (!whatsapp) {
        return new Response(
          JSON.stringify({ success: false, message: "WhatsApp não informado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar cliente e parcelas
      const cleanPhone = whatsapp.replace(/\D/g, "").slice(-11);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
        .limit(1);

      const client = clients?.[0];
      if (!client) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente não encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar total pendente
      const { data: installments } = await supabase
        .from("installments")
        .select("amount_due, fine")
        .eq("client_id", client.id)
        .in("status", ["Pendente", "Atrasado"]);

      const totalPending = (installments || []).reduce(
        (sum, i) => sum + (i.amount_due || 0) + (i.fine || 0), 0
      );

      if (totalPending === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente não possui débitos pendentes" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formatCurrency = (value: number) => 
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

      // Calcular opções de renegociação
      const options = [
        {
          id: 1,
          name: "À Vista com Desconto",
          description: "Pagamento único com 10% de desconto",
          total: totalPending * 0.9,
          total_formatted: formatCurrency(totalPending * 0.9),
          parcelas: 1,
          valor_parcela: formatCurrency(totalPending * 0.9),
          economia: formatCurrency(totalPending * 0.1),
          vantagem: "Maior economia"
        },
        {
          id: 2,
          name: "Parcelamento 6x",
          description: "Dividido em 6 vezes sem juros",
          total: totalPending,
          total_formatted: formatCurrency(totalPending),
          parcelas: 6,
          valor_parcela: formatCurrency(totalPending / 6),
          economia: formatCurrency(0),
          vantagem: "Sem juros"
        },
        {
          id: 3,
          name: "Parcelamento 12x",
          description: "Dividido em 12 vezes com juros de 1% ao mês",
          total: totalPending * 1.12,
          total_formatted: formatCurrency(totalPending * 1.12),
          parcelas: 12,
          valor_parcela: formatCurrency((totalPending * 1.12) / 12),
          economia: null,
          vantagem: "Menor parcela"
        }
      ];

      return new Response(
        JSON.stringify({
          success: true,
          client_name: client.name,
          divida_original: totalPending,
          divida_original_formatted: formatCurrency(totalPending),
          opcoes: options,
          resumo: `${client.name}, temos 3 opções para você: 1) À vista com 10% de desconto = ${options[0].total_formatted}; 2) 6x sem juros de ${options[1].valor_parcela}; 3) 12x de ${options[2].valor_parcela}.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: escalate_to_human - Escala para atendimento humano
    if (action === "escalate_to_human") {
      const { whatsapp, reason, conversation_summary } = body;
      
      if (!whatsapp || !reason) {
        return new Response(
          JSON.stringify({ success: false, message: "whatsapp e reason são obrigatórios" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar cliente
      const cleanPhone = whatsapp.replace(/\D/g, "").slice(-11);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
        .limit(1);

      const client = clients?.[0];

      // Registrar solicitação de escalonamento
      await supabase.from("activity_log").insert({
        operator_id: "agente-ia",
        client_id: client?.id || null,
        type: "escalation_request",
        description: `Escalonamento para atendimento humano. Motivo: ${reason}`,
        metadata: { 
          source: "agente-ia",
          whatsapp,
          reason,
          conversation_summary: conversation_summary || null,
          client_name: client?.name || "Não identificado"
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conversa escalonada para atendimento humano. Um operador entrará em contato em breve.",
          client_name: client?.name || "Não identificado",
          reason
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: get_pending_by_tier - Busca clientes segmentados por tempo de atraso
    if (action === "get_pending_by_tier") {
      const { tier } = body;
      
      const validTiers = ["mild", "moderate", "critical"];
      if (!tier || !validTiers.includes(tier)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "tier inválido. Use: mild (1-7 dias), moderate (8-30 dias) ou critical (30+ dias)" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const today = new Date();
      let minDays = 0, maxDays = 0;
      let tone = "amigavel";

      if (tier === "mild") {
        minDays = 1; maxDays = 7; tone = "amigavel";
      } else if (tier === "moderate") {
        minDays = 8; maxDays = 30; tone = "formal";
      } else if (tier === "critical") {
        minDays = 31; maxDays = 9999; tone = "urgente";
      }

      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() - maxDays);
      
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() - minDays);

      const { data: installments, error } = await supabase
        .from("installments")
        .select(`
          client_id,
          amount_due,
          due_date,
          fine,
          clients!inner(id, name, whatsapp, email, status)
        `)
        .eq("status", "Atrasado")
        .gte("due_date", minDate.toISOString().split("T")[0])
        .lte("due_date", maxDate.toISOString().split("T")[0])
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Agrupar por cliente
      const clientsMap = new Map();
      installments?.forEach((inst: any) => {
        const clientId = inst.client_id;
        if (!clientsMap.has(clientId)) {
          const daysOverdue = Math.floor((today.getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24));
          clientsMap.set(clientId, {
            id: inst.clients.id,
            name: inst.clients.name,
            whatsapp: inst.clients.whatsapp,
            email: inst.clients.email,
            pending_amount: 0,
            days_overdue: daysOverdue,
            oldest_due_date: inst.due_date,
          });
        }
        const client = clientsMap.get(clientId);
        client.pending_amount += (inst.amount_due || 0) + (inst.fine || 0);
      });

      return new Response(
        JSON.stringify({
          success: true,
          tier,
          suggested_tone: tone,
          count: clientsMap.size,
          clients: Array.from(clientsMap.values()),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: get_conversation_history - Busca histórico de interações
    if (action === "get_conversation_history") {
      const { whatsapp, limit = 5 } = body;
      
      if (!whatsapp) {
        return new Response(
          JSON.stringify({ success: false, message: "WhatsApp não informado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar cliente
      const cleanPhone = whatsapp.replace(/\D/g, "").slice(-11);
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
        .limit(1);

      const client = clients?.[0];
      if (!client) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente não encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar activity_log
      const { data: activities } = await supabase
        .from("activity_log")
        .select("type, description, created_at, metadata")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Buscar collection_logs
      const { data: collections } = await supabase
        .from("collection_logs")
        .select("channel, message, sent_at, status")
        .eq("client_id", client.id)
        .order("sent_at", { ascending: false })
        .limit(limit);

      // Combinar e ordenar timeline
      const timeline = [
        ...(activities || []).map(a => ({
          type: a.type,
          description: a.description,
          date: a.created_at,
          source: "activity"
        })),
        ...(collections || []).map(c => ({
          type: `collection_${c.channel}`,
          description: c.message?.substring(0, 100) + (c.message && c.message.length > 100 ? "..." : ""),
          date: c.sent_at,
          source: "collection",
          status: c.status
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
       .slice(0, limit);

      return new Response(
        JSON.stringify({
          success: true,
          client_name: client.name,
          history_count: timeline.length,
          history: timeline.map(t => ({
            ...t,
            date_formatted: new Date(t.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          })),
          resumo: timeline.length > 0 
            ? `Últimas ${timeline.length} interações com ${client.name}: ${timeline.map(t => t.type).join(", ")}`
            : `Não há histórico de interações recentes com ${client.name}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: send_whatsapp - Envia mensagem via Evolution API
    if (action === "send_whatsapp") {
      const { phone, message } = body;
      
      if (!phone || !message) {
        return new Response(
          JSON.stringify({ success: false, message: "phone e message são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const evolutionUrl = "https://credifacil-evolution-api.uqxoid.easypanel.host";
      const evolutionInstance = "credifacil";
      const evolutionApiKey = "BB8F1AB90F66-48A6-897C-B092EBFCEA82";

      // Limpar telefone e garantir formato correto
      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

      try {
        const evoResponse = await fetch(
          `${evolutionUrl}/message/sendText/${evolutionInstance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: message,
            }),
          }
        );

        const evoData = await evoResponse.json();

        if (!evoResponse.ok) {
          console.error("Evolution API error:", evoData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Erro ao enviar mensagem via Evolution API",
              error: evoData
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Mensagem enviada com sucesso",
            phone: formattedPhone,
            evolution_response: evoData
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (evoError) {
        console.error("Evolution API fetch error:", evoError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Erro de conexão com Evolution API",
            error: evoError instanceof Error ? evoError.message : "Unknown error"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        error: "Invalid action",
        available_actions: [
          "get_pending_clients", 
          "generate_messages", 
          "log_sent", 
          "get_client_info",
          "register_payment_promise",
          "get_renegotiation_options",
          "escalate_to_human",
          "get_pending_by_tier",
          "get_conversation_history",
          "send_whatsapp"
        ],
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
