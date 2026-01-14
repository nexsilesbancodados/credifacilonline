import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, pendingAmount, tone } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formattedAmount = new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(pendingAmount);

    const tonePrompts = {
      amigavel: `Crie uma mensagem de cobrança amigável e cordial para ${clientName}. 
        O valor pendente é ${formattedAmount}. 
        Seja simpático, use emojis moderadamente e ofereça ajuda para resolver a situação.
        Mantenha a mensagem curta e direta.`,
      formal: `Crie uma mensagem de cobrança formal e profissional para ${clientName}. 
        O valor pendente é ${formattedAmount}. 
        Use linguagem empresarial, seja respeitoso mas claro sobre a necessidade de regularização.
        Mantenha a mensagem objetiva.`,
      urgente: `Crie uma mensagem de cobrança urgente para ${clientName}. 
        O valor pendente é ${formattedAmount}. 
        Seja direto sobre a gravidade da situação, mencione possíveis consequências do não pagamento.
        Use tom assertivo mas profissional.`,
    };

    const systemPrompt = `Você é um assistente especializado em cobranças para uma empresa de empréstimos.
      Suas mensagens devem ser em português brasileiro.
      Nunca invente valores ou dados além dos fornecidos.
      A mensagem será enviada via WhatsApp.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.amigavel },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao gerar mensagem");
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
