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

    // Evolution API webhook format
    const event = payload.event || payload.type;
    const data = payload.data || payload;
    const instanceName = payload.instance || payload.instanceName || data.instance;

    // Only process incoming text messages
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

    // Check if group message (skip)
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
      .select("id, name, operator_id")
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

      // Check time window
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

    // Call AI agent
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
            content: `[Mensagem recebida via WhatsApp do número ${phone}${client ? ` (Cliente: ${client.name})` : ""}]\n\n${textContent}`,
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
    const responseText = aiData.response || "Desculpe, não consegui processar sua mensagem. Um atendente entrará em contato.";

    // Send reply via Evolution API
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");

    const sendResponse = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: formattedPhone, text: responseText }),
    });

    if (!sendResponse.ok) {
      console.error("Failed to send reply:", await sendResponse.text());
    }

    // Log the interaction
    if (client) {
      await supabase.from("collection_logs").insert({
        user_id: operatorId,
        client_id: client.id,
        channel: "whatsapp",
        message_sent: responseText,
        status: sendResponse.ok ? "sent" : "failed",
      });

      await supabase.from("activity_log").insert({
        operator_id: operatorId,
        client_id: client.id,
        type: "ai_auto_reply",
        description: `Resposta automática IA para: "${textContent.substring(0, 50)}..."`,
        metadata: {
          source: "whatsapp-webhook",
          phone,
          ai_tokens: aiData.usage?.tokens || 0,
          tool_calls: aiData.tool_calls?.length || 0,
        },
      });
    }

    return new Response(
      JSON.stringify({
        status: "processed",
        client_found: !!client,
        response_sent: sendResponse.ok,
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
