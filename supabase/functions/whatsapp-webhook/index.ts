import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

  if (!DEEPSEEK_API_KEY || !EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error("Missing required env vars");
    return new Response(JSON.stringify({ error: "Missing configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload).substring(0, 500));

    const event = payload.event || payload.type;
    const data = payload.data || payload;
    const instanceName = payload.instance || payload.instanceName || data.instance;

    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      return new Response(JSON.stringify({ status: "ignored", event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = data.message || data;
    const isFromMe = message.key?.fromMe || false;
    if (isFromMe) {
      return new Response(JSON.stringify({ status: "ignored", reason: "own_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteJid = message.key?.remoteJid || "";
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    const textContent = message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.body || "";

    if (!textContent || !phone) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (remoteJid.includes("@g.us")) {
      return new Response(JSON.stringify({ status: "ignored", reason: "group_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing message from ${phone}: ${textContent.substring(0, 100)}`);

    // Find client
    const cleanPhone = phone.replace(/\D/g, "").slice(-11);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, operator_id, status")
      .or(`whatsapp.ilike.%${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-9)}`)
      .limit(1);

    const client = clients?.[0];
    const operatorId = client?.operator_id || "webhook";

    // Check AI agent settings
    if (client?.operator_id) {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("ai_agent_active, ai_agent_start_time, ai_agent_end_time")
        .eq("operator_id", client.operator_id)
        .limit(1);

      const s = settings?.[0];
      if (s && !s.ai_agent_active) {
        console.log("AI agent disabled for operator");
        return new Response(JSON.stringify({ status: "ignored", reason: "agent_disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (s?.ai_agent_start_time && s?.ai_agent_end_time) {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        if (currentTime < s.ai_agent_start_time || currentTime > s.ai_agent_end_time) {
          console.log(`Outside operating hours: ${currentTime} not in ${s.ai_agent_start_time}-${s.ai_agent_end_time}`);
          return new Response(JSON.stringify({ status: "ignored", reason: "outside_hours" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Build context with memory
    let contextParts: string[] = [];
    
    // Load client memory for personalization
    if (client) {
      const { data: memories } = await supabase
        .from("client_memory")
        .select("key, value, category")
        .eq("client_id", client.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (memories && memories.length > 0) {
        const memoryContext = memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n");
        contextParts.push(`[Memória do cliente ${client.name}]\n${memoryContext}`);
      }

      // Load recent conversation history for continuity
      const { data: recentLogs } = await supabase
        .from("collection_logs")
        .select("message_sent, sent_at, status")
        .eq("client_id", client.id)
        .eq("channel", "whatsapp")
        .order("sent_at", { ascending: false })
        .limit(5);

      if (recentLogs && recentLogs.length > 0) {
        const recentContext = recentLogs.map((l: any) => 
          `[${new Date(l.sent_at).toLocaleDateString("pt-BR")}] Bot: ${l.message_sent?.substring(0, 100)}`
        ).join("\n");
        contextParts.push(`[Últimas interações com este cliente]\n${recentContext}`);
      }

      // Load pending installments summary
      const { data: installments } = await supabase
        .from("installments")
        .select("amount_due, due_date, status, fine, installment_number, total_installments")
        .eq("client_id", client.id)
        .in("status", ["Pendente", "Atrasado"])
        .order("due_date", { ascending: true })
        .limit(5);

      if (installments && installments.length > 0) {
        const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
        const total = installments.reduce((s: number, i: any) => s + (i.amount_due || 0) + (i.fine || 0), 0);
        const instContext = installments.map((i: any) => 
          `  Parcela ${i.installment_number}/${i.total_installments}: ${fmt(i.amount_due)} venc. ${new Date(i.due_date).toLocaleDateString("pt-BR")} (${i.status})`
        ).join("\n");
        contextParts.push(`[Dívida pendente: ${fmt(total)}]\n${instContext}`);
      }
    }

    const enrichedContext = contextParts.length > 0 ? `\n\n${contextParts.join("\n\n")}` : "";

    // Call AI agent with enriched context
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `[Mensagem recebida via WhatsApp do número ${phone}${client ? ` (Cliente: ${client.name}, Status: ${client.status})` : " (Cliente não cadastrado)"}]${enrichedContext}\n\nMensagem do cliente: "${textContent}"\n\nResponda diretamente ao cliente de forma empática e profissional. Se ele perguntar sobre sua dívida, use as ferramentas para consultar. Se ele quiser negociar, ofereça opções. Mantenha a resposta curta e adequada para WhatsApp.`,
          },
        ],
        operator_id: operatorId,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI agent error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI agent failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.response || "Desculpe, não consegui processar sua mensagem. Um atendente entrará em contato em breve.";

    // Clean markdown from WhatsApp response (remove ** bold markers etc)
    const cleanResponse = responseText
      .replace(/\*\*(.*?)\*\*/g, "*$1*")  // Convert markdown bold to WhatsApp bold
      .replace(/#{1,3}\s/g, "")           // Remove headers
      .replace(/```[\s\S]*?```/g, "")      // Remove code blocks
      .trim();

    // Send reply via Evolution API
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");

    const sendResponse = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: formattedPhone, text: cleanResponse }),
    });

    if (!sendResponse.ok) {
      console.error("Failed to send reply:", await sendResponse.text());
    }

    // Log and save memory
    if (client) {
      // Log interaction
      await supabase.from("collection_logs").insert({
        user_id: operatorId,
        client_id: client.id,
        channel: "whatsapp",
        message_sent: cleanResponse,
        status: sendResponse.ok ? "sent" : "failed",
      });

      await supabase.from("activity_log").insert({
        operator_id: operatorId,
        client_id: client.id,
        type: "ai_auto_reply",
        description: `Resposta automática IA para: "${textContent.substring(0, 50)}..."`,
        metadata: {
          source: "whatsapp-webhook-v2",
          phone,
          incoming_message: textContent.substring(0, 200),
          ai_tokens: aiData.usage?.tokens || 0,
          tool_calls: aiData.tool_calls?.length || 0,
        },
      });

      // Save conversation context to memory
      await supabase.from("client_memory").upsert({
        client_id: client.id,
        operator_id: operatorId,
        key: "last_whatsapp_interaction",
        value: new Date().toISOString(),
        category: "interaction",
      }, { onConflict: "client_id,key" });

      // Detect sentiment and save
      const lowerText = textContent.toLowerCase();
      let sentiment = "neutro";
      if (lowerText.match(/obrigad|agradeç|valeu|perfeito|ótimo|bom/)) sentiment = "positivo";
      else if (lowerText.match(/raiva|absurd|vergonha|advogado|procon|reclamar|palhaçada|roubo/)) sentiment = "negativo";
      else if (lowerText.match(/pagar|vou pagar|posso|quando|boleto|pix/)) sentiment = "interessado";

      await supabase.from("client_memory").upsert({
        client_id: client.id,
        operator_id: operatorId,
        key: "last_sentiment",
        value: sentiment,
        category: "behavior",
      }, { onConflict: "client_id,key" });

      // Track interaction count
      const { data: countMem } = await supabase
        .from("client_memory")
        .select("value")
        .eq("client_id", client.id)
        .eq("key", "whatsapp_interaction_count")
        .limit(1);

      const currentCount = countMem?.[0] ? parseInt(countMem[0].value) : 0;
      await supabase.from("client_memory").upsert({
        client_id: client.id,
        operator_id: operatorId,
        key: "whatsapp_interaction_count",
        value: String(currentCount + 1),
        category: "behavior",
      }, { onConflict: "client_id,key" });
    }

    return new Response(
      JSON.stringify({
        status: "processed",
        client_found: !!client,
        response_sent: sendResponse.ok,
        context_used: contextParts.length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
