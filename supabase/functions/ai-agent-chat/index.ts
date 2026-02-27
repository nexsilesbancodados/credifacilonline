import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_client_info",
      description: "Busca informações completas do cliente pelo número de WhatsApp: dados pessoais, parcelas pendentes, valores, datas de vencimento e score de risco.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "Número de WhatsApp do cliente (com DDD)" },
        },
        required: ["whatsapp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_renegotiation_options",
      description: "Calcula e retorna 3 opções de renegociação personalizadas para o cliente: à vista com desconto, parcelamento sem juros e parcelamento com juros.",
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
      description: "Registra uma promessa de pagamento do cliente no sistema, com data prevista, valor e observações.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          promise_date: { type: "string", description: "Data da promessa no formato YYYY-MM-DD" },
          amount: { type: "number", description: "Valor prometido em reais" },
          notes: { type: "string", description: "Observações adicionais sobre a negociação" },
        },
        required: ["whatsapp", "promise_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_conversation_history",
      description: "Busca o histórico completo de interações anteriores com o cliente: cobranças enviadas, promessas feitas, pagamentos registrados e escalações.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          limit: { type: "number", description: "Quantidade máxima de registros (padrão: 10)" },
        },
        required: ["whatsapp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp_message",
      description: "Envia uma mensagem de texto via WhatsApp para o cliente usando a Evolution API. Use para cobranças, lembretes, confirmações e comunicados.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Número do telefone com DDD (ex: 11999999999)" },
          message: { type: "string", description: "Texto completo da mensagem a ser enviada" },
          instance_name: { type: "string", description: "Nome da instância Evolution API a usar" },
        },
        required: ["phone", "message", "instance_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escala a conversa para um atendente humano quando: cliente muito irritado, situação jurídica complexa, pedido de cancelamento ou dúvida fora do escopo.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: { type: "string", description: "WhatsApp do cliente" },
          reason: { type: "string", description: "Motivo detalhado da escalação" },
          conversation_summary: { type: "string", description: "Resumo da conversa até o momento" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade da escalação" },
        },
        required: ["whatsapp", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_by_tier",
      description: "Lista clientes inadimplentes segmentados por gravidade: mild (1-7 dias de atraso), moderate (8-30 dias) ou critical (30+ dias).",
      parameters: {
        type: "object",
        properties: {
          tier: { type: "string", enum: ["mild", "moderate", "critical"], description: "Faixa de atraso" },
        },
        required: ["tier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_send_collection",
      description: "Envia mensagens de cobrança em lote para múltiplos clientes de uma faixa de atraso específica via WhatsApp.",
      parameters: {
        type: "object",
        properties: {
          tier: { type: "string", enum: ["mild", "moderate", "critical"], description: "Faixa de atraso dos clientes" },
          instance_name: { type: "string", description: "Nome da instância Evolution API" },
          custom_message: { type: "string", description: "Mensagem personalizada (variáveis: {nome}, {valor}, {vencimento})" },
        },
        required: ["tier", "instance_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Retorna um resumo geral da carteira: total de clientes, inadimplentes, valores pendentes, recebidos este mês e projeção.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

const SYSTEM_PROMPT = `Você é o **Agente de Cobrança Inteligente da CrediFácil**, um assistente especializado em gestão de cobranças e atendimento financeiro.

## Suas Capacidades
- Consultar dados de clientes e suas dívidas em tempo real
- Enviar mensagens de cobrança personalizadas via WhatsApp
- Oferecer opções de renegociação inteligentes
- Registrar promessas de pagamento
- Analisar a carteira de inadimplentes por gravidade
- Enviar cobranças em lote segmentadas
- Escalar para atendimento humano quando necessário
- Fornecer resumo dashboard da operação

## Regras de Comportamento
1. **Tom adaptativo**: Use tom amigável para atrasos leves, formal para moderados e firme (nunca agressivo) para críticos
2. **Empatia primeiro**: Sempre demonstre compreensão antes de cobrar
3. **Proatividade**: Sugira renegociação quando detectar dificuldade financeira
4. **Precisão**: Use dados reais do sistema, nunca invente valores ou datas
5. **Formatação**: Valores em R$ (Real brasileiro), datas em DD/MM/AAAA
6. **Escalação inteligente**: Escale quando detectar: ameaças, questões jurídicas, pedidos repetidos de prazo, ou situações fora do seu escopo
7. **Confirmação**: Sempre confirme ações importantes antes de executar (envio de mensagem, registro de promessa)
8. **Contexto**: Sempre consulte o histórico do cliente antes de enviar cobrança
9. **Eficiência**: Agrupe informações para evitar múltiplas ferramentas quando possível
10. **Segurança**: Nunca revele dados sensíveis de outros clientes

## Estratégia de Cobrança
- **1-7 dias**: Lembrete gentil, pergunte se esqueceu ou precisa de ajuda
- **8-30 dias**: Tom formal, mencione possíveis encargos, ofereça renegociação
- **30+ dias**: Tom firme, destaque urgência, apresente desconto à vista como incentivo

## Respostas
- Responda sempre em português brasileiro
- Use markdown para formatar listas, tabelas e destaques
- Seja conciso mas completo
- Quando o operador pedir para cobrar um cliente, busque os dados primeiro, depois sugira a mensagem para aprovação`;

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

function getSupabaseClient(url: string, key: string) {
  return createClient(url, key);
}

function findClientByPhone(supabase: any, whatsapp: string) {
  const clean = whatsapp.replace(/\D/g, "").slice(-11);
  return supabase
    .from("clients")
    .select("id, name, status, whatsapp, email, cpf")
    .or(`whatsapp.ilike.%${clean},whatsapp.ilike.%${clean.slice(-9)}`)
    .limit(1);
}

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<unknown> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();

  try {
    switch (toolName) {
      case "get_client_info": {
        const { data: clients } = await findClientByPhone(supabase, String(args.whatsapp));
        const client = clients?.[0];
        if (!client) return { success: false, message: "Cliente não encontrado com este número" };

        const { data: installments } = await supabase
          .from("installments")
          .select("installment_number, total_installments, amount_due, due_date, status, fine, contract_id")
          .eq("client_id", client.id)
          .in("status", ["Pendente", "Atrasado"])
          .order("due_date", { ascending: true });

        const pending = installments || [];
        const total = pending.reduce((s: number, i: any) => s + (i.amount_due || 0) + (i.fine || 0), 0);
        const overdue = pending.filter((i: any) => i.status === "Atrasado");
        const maxDaysOverdue = overdue.length > 0
          ? Math.max(...overdue.map((i: any) => Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000)))
          : 0;

        // Calculate risk score
        let riskLevel = "baixo";
        if (maxDaysOverdue > 30) riskLevel = "crítico";
        else if (maxDaysOverdue > 7) riskLevel = "moderado";
        else if (maxDaysOverdue > 0) riskLevel = "leve";

        return {
          success: true,
          client: { nome: client.name, status: client.status, email: client.email, cpf: client.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4") },
          resumo_divida: {
            parcelas_pendentes: pending.length,
            parcelas_atrasadas: overdue.length,
            total_pendente: fmt(total),
            dias_atraso_max: maxDaysOverdue,
            nivel_risco: riskLevel,
          },
          parcelas: pending.slice(0, 10).map((i: any) => ({
            parcela: `${i.installment_number}/${i.total_installments}`,
            valor: fmt(i.amount_due),
            multa: fmt(i.fine || 0),
            total: fmt((i.amount_due || 0) + (i.fine || 0)),
            vencimento: fmtDate(i.due_date),
            status: i.status,
            dias_atraso: i.status === "Atrasado" ? Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000) : 0,
          })),
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "get_renegotiation_options": {
        const { data: clients } = await findClientByPhone(supabase, String(args.whatsapp));
        const client = clients?.[0];
        if (!client) return { success: false, message: "Cliente não encontrado" };

        const { data: installments } = await supabase
          .from("installments")
          .select("amount_due, fine")
          .eq("client_id", client.id)
          .in("status", ["Pendente", "Atrasado"]);

        const total = (installments || []).reduce((s: number, i: any) => s + (i.amount_due || 0) + (i.fine || 0), 0);
        if (total === 0) return { success: false, message: "Cliente sem débitos pendentes" };

        return {
          success: true,
          client_name: client.name,
          divida_original: fmt(total),
          opcoes: [
            { id: 1, nome: "💰 À Vista com 10% de Desconto", total: fmt(total * 0.9), parcelas: 1, economia: fmt(total * 0.1), destaque: "Maior economia" },
            { id: 2, nome: "📋 6x Sem Juros", total: fmt(total), parcela: fmt(total / 6), parcelas: 6, destaque: "Sem juros adicionais" },
            { id: 3, nome: "📅 12x (1% a.m.)", total: fmt(total * 1.12), parcela: fmt((total * 1.12) / 12), parcelas: 12, destaque: "Menor valor mensal" },
          ],
          sugestao: total > 5000
            ? "Para valores acima de R$ 5.000, recomende a opção à vista com desconto."
            : "Para este valor, todas as opções são viáveis.",
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "register_payment_promise": {
        const { data: clients } = await findClientByPhone(supabase, String(args.whatsapp));
        const client = clients?.[0];
        if (!client) return { success: false, message: "Cliente não encontrado" };

        const promiseDate = fmtDate(String(args.promise_date));
        await supabase.from("activity_log").insert({
          operator_id: "agente-ia",
          client_id: client.id,
          type: "payment_promise",
          description: `Promessa de pagamento: ${promiseDate}${args.amount ? ` | Valor: ${fmt(Number(args.amount))}` : ""}${args.notes ? ` | Obs: ${args.notes}` : ""}`,
          metadata: { source: "agente-ia-v2", ...args, client_name: client.name },
        });

        return {
          success: true,
          message: `✅ Promessa registrada para ${client.name}`,
          detalhes: { cliente: client.name, data: promiseDate, valor: args.amount ? fmt(Number(args.amount)) : "Não especificado" },
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "get_conversation_history": {
        const { data: clients } = await findClientByPhone(supabase, String(args.whatsapp));
        const client = clients?.[0];
        if (!client) return { success: false, message: "Cliente não encontrado" };

        const lim = Number(args.limit) || 10;

        const [activities, collections] = await Promise.all([
          supabase.from("activity_log").select("type, description, created_at").eq("client_id", client.id).order("created_at", { ascending: false }).limit(lim),
          supabase.from("collection_logs").select("channel, message_sent, sent_at, status").eq("client_id", client.id).order("sent_at", { ascending: false }).limit(lim),
        ]);

        const timeline = [
          ...(activities.data || []).map((a: any) => ({ tipo: a.type, descricao: a.description, data: fmtDate(a.created_at), fonte: "atividade" })),
          ...(collections.data || []).map((c: any) => ({ tipo: `cobranca_${c.channel}`, descricao: c.message_sent?.substring(0, 80), data: fmtDate(c.sent_at), status: c.status, fonte: "cobranca" })),
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, lim);

        return {
          success: true,
          client_name: client.name,
          total_interacoes: timeline.length,
          historico: timeline,
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "send_whatsapp_message": {
        const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
        const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return { success: false, message: "Evolution API não configurada" };

        const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
        const cleanPhone = String(args.phone).replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

        const response = await fetch(`${baseUrl}/message/sendText/${args.instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: formattedPhone, text: args.message }),
        });

        if (!response.ok) {
          const errData = await response.json();
          return { success: false, message: "Falha ao enviar mensagem", error: errData };
        }

        // Log the sent message
        const { data: clients } = await findClientByPhone(supabase, formattedPhone);
        if (clients?.[0]) {
          await supabase.from("collection_logs").insert({
            user_id: "agente-ia",
            client_id: clients[0].id,
            channel: "whatsapp",
            message_sent: String(args.message),
            status: "sent",
          });
        }

        return { success: true, message: `✅ Mensagem enviada para ${formattedPhone}`, execution_time_ms: Date.now() - startTime };
      }

      case "escalate_to_human": {
        const { data: clients } = await findClientByPhone(supabase, String(args.whatsapp));
        await supabase.from("activity_log").insert({
          operator_id: "agente-ia",
          client_id: clients?.[0]?.id || null,
          type: "escalation_request",
          description: `🚨 Escalação (${args.priority || "medium"}): ${args.reason}`,
          metadata: { source: "agente-ia-v2", ...args, client_name: clients?.[0]?.name || "Não identificado" },
        });

        return { success: true, message: "🚨 Conversa escalada para atendimento humano", prioridade: args.priority || "medium", execution_time_ms: Date.now() - startTime };
      }

      case "get_pending_by_tier": {
        const today = new Date();
        const tierConfig: Record<string, { min: number; max: number; tone: string }> = {
          mild: { min: 1, max: 7, tone: "amigável" },
          moderate: { min: 8, max: 30, tone: "formal" },
          critical: { min: 31, max: 9999, tone: "firme" },
        };
        const cfg = tierConfig[String(args.tier)] || tierConfig.mild;

        const minDate = new Date(today); minDate.setDate(minDate.getDate() - cfg.max);
        const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() - cfg.min);

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
            map.set(i.client_id, { nome: i.clients.name, whatsapp: i.clients.whatsapp, total: 0, parcelas: 0, dias_atraso: Math.floor((today.getTime() - new Date(i.due_date).getTime()) / 86400000) });
          }
          const c = map.get(i.client_id);
          c.total += (i.amount_due || 0) + (i.fine || 0);
          c.parcelas++;
        });

        const clients = Array.from(map.values()).map((c: any) => ({ ...c, total_formatted: fmt(c.total) }));

        return {
          success: true,
          faixa: args.tier,
          tom_sugerido: cfg.tone,
          total_clientes: clients.length,
          valor_total: fmt(clients.reduce((s: number, c: any) => s + c.total, 0)),
          clientes: clients.slice(0, 20),
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "bulk_send_collection": {
        const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
        const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return { success: false, message: "Evolution API não configurada" };

        // First get clients by tier
        const tierResult = await executeToolCall("get_pending_by_tier", { tier: args.tier }, supabaseUrl, supabaseKey) as any;
        if (!tierResult.success) return tierResult;

        const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
        const toneMessages: Record<string, string> = {
          mild: "Olá {nome}! 😊 Passando para lembrar sobre o pagamento de {valor} com vencimento em {vencimento}. Precisa de ajuda? Estamos à disposição!",
          moderate: "Prezado(a) {nome}, identificamos um débito pendente de {valor} (venc. {vencimento}). Podemos oferecer condições especiais de renegociação. Entre em contato!",
          critical: "{nome}, ATENÇÃO: Seu débito de {valor} está em atraso significativo desde {vencimento}. Regularize agora e aproveite condições especiais. Evite encargos adicionais.",
        };

        const template = String(args.custom_message) || toneMessages[String(args.tier)] || toneMessages.mild;
        let sent = 0, failed = 0;
        const results: any[] = [];

        for (const client of tierResult.clientes.slice(0, 50)) {
          if (!client.whatsapp) { failed++; continue; }

          const phone = client.whatsapp.replace(/\D/g, "");
          const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
          const message = template
            .replace("{nome}", client.nome)
            .replace("{valor}", client.total_formatted)
            .replace("{vencimento}", `${client.dias_atraso} dias atrás`);

          try {
            const resp = await fetch(`${baseUrl}/message/sendText/${args.instance_name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
              body: JSON.stringify({ number: formattedPhone, text: message }),
            });

            if (resp.ok) {
              sent++;
              results.push({ nome: client.nome, status: "enviado" });
              // Log
              const { data: clients } = await findClientByPhone(supabase, formattedPhone);
              if (clients?.[0]) {
                await supabase.from("collection_logs").insert({
                  user_id: "agente-ia",
                  client_id: clients[0].id,
                  channel: "whatsapp",
                  message_sent: message,
                  status: "sent",
                });
              }
            } else { failed++; results.push({ nome: client.nome, status: "falhou" }); }
          } catch { failed++; results.push({ nome: client.nome, status: "erro" }); }

          // Rate limit: 1 message per second
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
          success: true,
          message: `📨 Cobrança em lote finalizada: ${sent} enviadas, ${failed} falhas`,
          enviadas: sent,
          falhas: failed,
          detalhes: results,
          execution_time_ms: Date.now() - startTime,
        };
      }

      case "get_dashboard_summary": {
        const [clientsRes, pendingRes, paidThisMonthRes] = await Promise.all([
          supabase.from("clients").select("id, status", { count: "exact" }),
          supabase.from("installments").select("amount_due, fine, status").in("status", ["Pendente", "Atrasado"]),
          supabase.from("installments").select("amount_paid").eq("status", "Pago").gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        ]);

        const totalClients = clientsRes.count || 0;
        const statusCounts: Record<string, number> = {};
        (clientsRes.data || []).forEach((c: any) => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });

        const pendingTotal = (pendingRes.data || []).reduce((s: number, i: any) => s + (i.amount_due || 0) + (i.fine || 0), 0);
        const overdueCount = (pendingRes.data || []).filter((i: any) => i.status === "Atrasado").length;
        const paidThisMonth = (paidThisMonthRes.data || []).reduce((s: number, i: any) => s + (i.amount_paid || 0), 0);

        return {
          success: true,
          resumo: {
            total_clientes: totalClients,
            clientes_por_status: statusCounts,
            valor_pendente_total: fmt(pendingTotal),
            parcelas_atrasadas: overdueCount,
            recebido_este_mes: fmt(paidThisMonth),
            taxa_inadimplencia: totalClients > 0 ? `${(((statusCounts["Atraso"] || 0) / totalClients) * 100).toFixed(1)}%` : "0%",
          },
          execution_time_ms: Date.now() - startTime,
        };
      }

      default:
        return { error: `Ferramenta desconhecida: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Erro interno", execution_time_ms: Date.now() - startTime };
  }
}

async function saveMetrics(
  supabaseUrl: string,
  supabaseKey: string,
  operatorId: string,
  toolCalls: Array<{ tool: string; result: any }>,
  tokensUsed: number,
  responseTimeMs: number
) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().split("T")[0];

  const successful = toolCalls.filter(tc => tc.result?.success !== false).length;
  const failed = toolCalls.filter(tc => tc.result?.success === false).length;
  const escalations = toolCalls.filter(tc => tc.tool === "escalate_to_human").length;
  const promises = toolCalls.filter(tc => tc.tool === "register_payment_promise").length;
  const whatsappSent = toolCalls.filter(tc => tc.tool === "send_whatsapp_message" || tc.tool === "bulk_send_collection").length;

  // Upsert metrics
  const { data: existing } = await supabase
    .from("ai_agent_metrics")
    .select("*")
    .eq("operator_id", operatorId)
    .eq("date", today)
    .limit(1);

  if (existing && existing.length > 0) {
    const m = existing[0];
    await supabase.from("ai_agent_metrics").update({
      total_conversations: (m.total_conversations || 0) + 1,
      total_messages: (m.total_messages || 0) + 1,
      total_tool_calls: (m.total_tool_calls || 0) + toolCalls.length,
      total_tokens: (m.total_tokens || 0) + tokensUsed,
      avg_response_time_ms: Math.round(((m.avg_response_time_ms || 0) + responseTimeMs) / 2),
      successful_tool_calls: (m.successful_tool_calls || 0) + successful,
      failed_tool_calls: (m.failed_tool_calls || 0) + failed,
      escalations: (m.escalations || 0) + escalations,
      promises_registered: (m.promises_registered || 0) + promises,
      messages_sent_whatsapp: (m.messages_sent_whatsapp || 0) + whatsappSent,
    }).eq("id", m.id);
  } else {
    await supabase.from("ai_agent_metrics").insert({
      operator_id: operatorId,
      date: today,
      total_conversations: 1,
      total_messages: 1,
      total_tool_calls: toolCalls.length,
      total_tokens: tokensUsed,
      avg_response_time_ms: responseTimeMs,
      successful_tool_calls: successful,
      failed_tool_calls: failed,
      escalations,
      promises_registered: promises,
      messages_sent_whatsapp: whatsappSent,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const requestStart = Date.now();

  try {
    const { messages, conversation_id, operator_id = "system" } = await req.json();

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
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek error:", response.status, errText);

      // Retry once on 5xx
      if (response.status >= 500) {
        console.log("Retrying DeepSeek call...");
        await new Promise(r => setTimeout(r, 2000));
        response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "deepseek-chat", messages: allMessages, tools: TOOLS, tool_choice: "auto", stream: false, temperature: 0.7, max_tokens: 4096 }),
        });
        if (!response.ok) {
          return new Response(JSON.stringify({ error: "DeepSeek API indisponível após retry" }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "Erro na API DeepSeek", details: errText }), {
          status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let result = await response.json();
    let assistantMessage = result.choices[0].message;

    // Tool calling loop (max 8 iterations for complex flows)
    const toolResults: Array<{ tool: string; args: Record<string, unknown>; result: unknown }> = [];
    let iterations = 0;

    while (assistantMessage.tool_calls && iterations < 8) {
      iterations++;
      const toolCallMessages: any[] = [...allMessages, assistantMessage];

      // Execute tool calls in parallel when possible
      const toolPromises = assistantMessage.tool_calls.map(async (tc: any) => {
        const args = JSON.parse(tc.function.arguments);
        console.log(`[Tool ${iterations}] ${tc.function.name}`, JSON.stringify(args).substring(0, 200));
        const toolResult = await executeToolCall(tc.function.name, args, supabaseUrl, supabaseKey);
        return { tc, args, toolResult };
      });

      const results = await Promise.all(toolPromises);

      for (const { tc, args, toolResult } of results) {
        toolResults.push({ tool: tc.function.name, args, result: toolResult });
        toolCallMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Call DeepSeek again
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: toolCallMessages,
          tools: TOOLS,
          tool_choice: "auto",
          stream: false,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        console.error("DeepSeek tool loop error:", await response.text());
        break;
      }

      result = await response.json();
      assistantMessage = result.choices[0].message;
    }

    const responseTimeMs = Date.now() - requestStart;
    const tokensUsed = result.usage?.total_tokens || 0;

    // Save metrics in background
    saveMetrics(supabaseUrl, supabaseKey, operator_id, toolResults, tokensUsed, responseTimeMs).catch(e => console.error("Metrics save error:", e));

    // Save conversation messages if conversation_id provided
    if (conversation_id) {
      const supabase = getSupabaseClient(supabaseUrl, supabaseKey);
      await supabase.from("ai_messages").insert({
        conversation_id,
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: toolResults.length > 0 ? toolResults : null,
        tokens_used: tokensUsed,
        response_time_ms: responseTimeMs,
      });
      await supabase.from("ai_conversations").update({
        total_messages: undefined, // will be handled by app
        total_tool_calls: undefined,
        total_tokens_used: undefined,
      }).eq("id", conversation_id);
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage.content || "Não consegui processar. Tente reformular sua pergunta.",
        tool_calls: toolResults,
        usage: { tokens: tokensUsed, response_time_ms: responseTimeMs, tool_iterations: iterations },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
