import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  to: string;
  message: string;
  client_id?: string;
  installment_id?: string;
  rule_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    // Check if WhatsApp is configured
    if (!whatsappToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "WhatsApp API not configured",
          message: "Configure WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID nas secrets",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { messages, user_id } = body as { messages: WhatsAppMessage[]; user_id: string };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const msg of messages) {
      try {
        // Clean phone number (remove non-digits)
        const cleanPhone = msg.to.replace(/\D/g, "");
        
        // Ensure phone has country code (Brazil = 55)
        const formattedPhone = cleanPhone.startsWith("55") 
          ? cleanPhone 
          : `55${cleanPhone}`;

        // Send via Meta WhatsApp Business API
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: formattedPhone,
              type: "text",
              text: {
                preview_url: false,
                body: msg.message,
              },
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          // Log successful send to collection_logs
          if (user_id && msg.client_id) {
            await supabase.from("collection_logs").insert({
              user_id,
              client_id: msg.client_id,
              installment_id: msg.installment_id || null,
              rule_id: msg.rule_id || null,
              message_sent: msg.message,
              channel: "whatsapp",
              status: "sent",
              delivered_at: new Date().toISOString(),
            });
          }

          results.push({
            phone: formattedPhone,
            success: true,
            message_id: result.messages?.[0]?.id,
          });
        } else {
          errors.push({
            phone: formattedPhone,
            success: false,
            error: result.error?.message || "Unknown error",
          });

          // Log failed attempt
          if (user_id && msg.client_id) {
            await supabase.from("collection_logs").insert({
              user_id,
              client_id: msg.client_id,
              installment_id: msg.installment_id || null,
              rule_id: msg.rule_id || null,
              message_sent: msg.message,
              channel: "whatsapp",
              status: "failed",
            });
          }
        }
      } catch (err) {
        errors.push({
          phone: msg.to,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        sent: results.length,
        failed: errors.length,
        results,
        errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-whatsapp-message:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
