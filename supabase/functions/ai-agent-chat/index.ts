import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tools available for the AI agent
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_client_info",
      description: "Busca informações do cliente pelo número de WhatsApp, incluindo parcelas pendentes, valores e datas de vencimento.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "Número de WhatsApp do cliente" },
        },
        required: ["whatsapp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_renegotiation_options",
      description: "Retorna opções de renegociação de dívida do cliente (à vista com desconto, parcelamento 6x, 12x).",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "Número de WhatsApp do cliente" },
        },
        required: ["whatsapp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_payment_promise",
      description: "Registra uma promessa de pagamento do cliente com data e valor.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          promise_date: { type: "string", description: "Data da promessa (YYYY-MM-DD)" },
          amount: { type: "number", description: "Valor prometido" },
          notes: { type: "string", description: "Observações adicionais" },
        },
        required: ["whatsapp", "promise_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_conversation_history",
      description: "Busca histórico de interações anteriores com o cliente.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          limit: { type: "number", description: "Quantidade de registros (padrão 5)" },
        },
        required: ["whatsapp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp_message",
      description: "Envia uma mensagem de texto via WhatsApp para o cliente usando a Evolution API.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Número do telefone (com DDD)" },
          message: { type: "string", description: "Texto da mensagem" },
          instance_name: { type: "string", description: "Nome da instância Evolution API" },
        },
        required: ["phone", "message", "instance_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escala a conversa para um atendente humano quando o agente não consegue resolver.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          reason: { type: "string", description: "Motivo da escalação" },
          conversation_summary: { type: "string", description: "Resumo da conversa" },
        },
        required: ["whatsapp", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_by_tier",
      description: "Lista clientes inadimplentes por faixa de atraso: mild (1-7 dias), moderate (8-30), critical (30+).",
      parameters: {
        type: "object",
        properties: {
          tier: { type: "string", enum: ["mild", "moderate", "critical"], description: "Faixa de atraso" },
        },
        required: ["tier"],
      },
    },
  },
];

const SYSTEM_PROMPT = `Você é o Agente de Cobrança Inteligente da CrediFácil. Seu papel é:

1. **Atendimento ao Cliente**: Responder dúvidas sobre dívidas, parcelas e pagamentos de forma educada e profissional.
2. **Cobrança Proativa**: Contactar clientes inadimplentes com tom adequado ao tempo de atraso.
3. **Negociação**: Oferecer opções de renegociação e registrar promessas de pagamento.
4. **Escalação**: Quando não conseguir resolver, escalar para atendente humano.

Regras:
- Sempre seja educado e empático
- Use linguagem profissional mas acessível
- Ao identificar um cliente, busque suas informações antes de responder
- Ofereça opções de renegociação quando aplicável
- Registre qualquer promessa de pagamento feita pelo cliente
- Se o cliente estiver muito irritado ou fizer ameaças, escale para humano
- Formate valores em Real brasileiro (R$)
- Use datas no formato brasileiro (DD/MM/AAAA)
- Quando enviar mensagem via WhatsApp, confirme o envio ao operador

Você tem acesso a ferramentas para consultar dados, enviar mensagens e registrar ações.`;

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<unknown> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (toolName === "send_whatsapp_message") {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return { success: false, message: "Evolution API não configurada" };
    }

    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
    const cleanPhone = String(args.phone).replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(
      `${baseUrl}/message/sendText/${args.instance_name}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: formattedPhone, text: args.message }),
      }
    );

    const data = await response.json();
    if (!response.ok) return { success: false, error: data };
    return { success: true, message: "Mensagem enviada com sucesso", phone: formattedPhone };
  }

  // For other tools, call the n8n-webhook function internally
  const actionMap: Record<string, string> = {
    get_client_info: "get_client_info",
    get_renegotiation_options: "get_renegotiation_options",
    register_payment_promise: "register_payment_promise",
    get_conversation_history: "get_conversation_history",
    escalate_to_human: "escalate_to_human",
    get_pending_by_tier: "get_pending_by_tier",
  };

  const action = actionMap[toolName];
  if (!action) return { error: `Unknown tool: ${toolName}` };

  // Execute directly against Supabase
  if (action === "get_client_info") {
    const cleanPhone = String(args.whatsapp).replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, status, whatsapp")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    const client = clients?.[0];
    if (!client) return { success: false, message: "Cliente não encontrado" };

    const { data: installments } = await supabase
      .from("installments")
      .select("installment_number, total_installments, amount_due, due_date, status, fine")
      .eq("client_id", client.id)
      .in("status", ["Pendente", "Atrasado"])
      .order("due_date", { ascending: true });

    const pending = installments || [];
    const total = pending.reduce((s, i) => s + (i.amount_due || 0) + (i.fine || 0), 0);
    const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    return {
      success: true,
      client: { name: client.name, status: client.status },
      pending_count: pending.length,
      total_pending: fmt(total),
      installments: pending.map((i) => ({
        parcela: `${i.installment_number}/${i.total_installments}`,
        valor: fmt(i.amount_due),
        multa: fmt(i.fine || 0),
        total: fmt((i.amount_due || 0) + (i.fine || 0)),
        vencimento: new Date(i.due_date).toLocaleDateString("pt-BR"),
        status: i.status,
      })),
    };
  }

  if (action === "get_renegotiation_options") {
    const cleanPhone = String(args.whatsapp).replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    const client = clients?.[0];
    if (!client) return { success: false, message: "Cliente não encontrado" };

    const { data: installments } = await supabase
      .from("installments")
      .select("amount_due, fine")
      .eq("client_id", client.id)
      .in("status", ["Pendente", "Atrasado"]);

    const totalPending = (installments || []).reduce((s, i) => s + (i.amount_due || 0) + (i.fine || 0), 0);
    if (totalPending === 0) return { success: false, message: "Sem débitos pendentes" };

    const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    return {
      success: true,
      client_name: client.name,
      divida_total: fmt(totalPending),
      opcoes: [
        { nome: "À Vista -10%", total: fmt(totalPending * 0.9), parcelas: 1 },
        { nome: "6x sem juros", total: fmt(totalPending), parcela: fmt(totalPending / 6) },
        { nome: "12x (1% a.m.)", total: fmt(totalPending * 1.12), parcela: fmt((totalPending * 1.12) / 12) },
      ],
    };
  }

  if (action === "register_payment_promise") {
    const cleanPhone = String(args.whatsapp).replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    const client = clients?.[0];
    if (!client) return { success: false, message: "Cliente não encontrado" };

    await supabase.from("activity_log").insert({
      operator_id: "agente-ia",
      client_id: client.id,
      type: "payment_promise",
      description: `Promessa: ${new Date(String(args.promise_date)).toLocaleDateString("pt-BR")}${args.amount ? ` - R$ ${args.amount}` : ""}${args.notes ? ` | ${args.notes}` : ""}`,
      metadata: { source: "agente-ia", ...args },
    });

    return { success: true, message: `Promessa registrada para ${client.name}` };
  }

  if (action === "get_conversation_history") {
    const cleanPhone = String(args.whatsapp).replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    const client = clients?.[0];
    if (!client) return { success: false, message: "Cliente não encontrado" };

    const { data: activities } = await supabase
      .from("activity_log")
      .select("type, description, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(Number(args.limit) || 5);

    return {
      success: true,
      client_name: client.name,
      history: (activities || []).map((a) => ({
        tipo: a.type,
        descricao: a.description,
        data: new Date(a.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        }),
      })),
    };
  }

  if (action === "escalate_to_human") {
    const cleanPhone = String(args.whatsapp).replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    await supabase.from("activity_log").insert({
      operator_id: "agente-ia",
      client_id: clients?.[0]?.id || null,
      type: "escalation_request",
      description: `Escalação: ${args.reason}`,
      metadata: { source: "agente-ia", ...args },
    });

    return { success: true, message: "Conversa escalada para atendimento humano" };
  }

  if (action === "get_pending_by_tier") {
    const today = new Date();
    let minDays = 0, maxDays = 0;
    if (args.tier === "mild") { minDays = 1; maxDays = 7; }
    else if (args.tier === "moderate") { minDays = 8; maxDays = 30; }
    else { minDays = 31; maxDays = 9999; }

    const minDate = new Date(today); minDate.setDate(minDate.getDate() - maxDays);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() - minDays);

    const { data: installments } = await supabase
      .from("installments")
      .select("client_id, amount_due, due_date, fine, clients!inner(id, name, whatsapp)")
      .eq("status", "Atrasado")
      .gte("due_date", minDate.toISOString().split("T")[0])
      .lte("due_date", maxDate.toISOString().split("T")[0])
      .order("due_date", { ascending: true });

    const map = new Map();
    (installments || []).forEach((i: any) => {
      if (!map.has(i.client_id)) {
        map.set(i.client_id, { nome: i.clients.name, whatsapp: i.clients.whatsapp, total: 0, dias_atraso: Math.floor((today.getTime() - new Date(i.due_date).getTime()) / 86400000) });
      }
      map.get(i.client_id).total += (i.amount_due || 0) + (i.fine || 0);
    });

    const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    return {
      success: true,
      tier: args.tier,
      count: map.size,
      clients: Array.from(map.values()).map((c: any) => ({ ...c, total_formatted: fmt(c.total) })),
    };
  }

  return { error: "Action not implemented" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { messages, stream = false } = await req.json();

    const allMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // DeepSeek API call with tool calling
    let response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: allMessages,
        tools: TOOLS,
        tool_choice: "auto",
        stream: false, // We handle tool calls first, then optionally stream final
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek error:", response.status, errText);
      return new Response(JSON.stringify({ error: "DeepSeek API error", details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result = await response.json();
    let assistantMessage = result.choices[0].message;

    // Tool calling loop (max 5 iterations)
    const toolResults: Array<{ tool: string; args: Record<string, unknown>; result: unknown }> = [];
    let iterations = 0;

    while (assistantMessage.tool_calls && iterations < 5) {
      iterations++;
      const toolCallMessages = [...allMessages, assistantMessage];

      for (const tc of assistantMessage.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        console.log(`Executing tool: ${tc.function.name}`, args);

        const toolResult = await executeToolCall(tc.function.name, args, supabaseUrl, supabaseKey);
        toolResults.push({ tool: tc.function.name, args, result: toolResult });

        toolCallMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Call DeepSeek again with tool results
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: toolCallMessages,
          tools: TOOLS,
          tool_choice: "auto",
          stream: false,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("DeepSeek tool loop error:", errText);
        break;
      }

      result = await response.json();
      assistantMessage = result.choices[0].message;
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage.content || "Não consegui processar sua solicitação.",
        tool_calls: toolResults,
        usage: result.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
