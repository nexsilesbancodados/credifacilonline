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
    const { clientName, pendingAmount, totalInstallments, paidInstallments, currentRate, clientStatus } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formattedAmount = new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(pendingAmount);

    const systemPrompt = `Você é um analista financeiro especializado em renegociação de dívidas.
      Analise os dados do cliente e sugira os melhores termos de renegociação.
      Considere: capacidade de pagamento, histórico, risco de inadimplência e margem de lucro da empresa.
      Responda APENAS com o JSON solicitado, sem texto adicional.`;

    const userPrompt = `Analise este cliente e sugira termos de renegociação:
      - Nome: ${clientName}
      - Valor pendente: ${formattedAmount}
      - Parcelas originais: ${totalInstallments}
      - Parcelas pagas: ${paidInstallments}
      - Taxa atual: ${currentRate}% a.m.
      - Status: ${clientStatus}

      Retorne um JSON com esta estrutura exata:
      {
        "installments": número de parcelas sugerido (entre 2 e 24),
        "rate": taxa de juros sugerida (entre 3 e 15),
        "reason": "Explicação clara em português de por que esses termos são ideais"
      }`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_renegotiation",
              description: "Sugere termos de renegociação para o cliente",
              parameters: {
                type: "object",
                properties: {
                  installments: { type: "number", description: "Número de parcelas sugerido" },
                  rate: { type: "number", description: "Taxa de juros sugerida" },
                  reason: { type: "string", description: "Explicação da sugestão" }
                },
                required: ["installments", "rate", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_renegotiation" } },
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
      throw new Error("Erro ao gerar sugestão");
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const suggestion = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(suggestion),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to parsing content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const suggestion = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(suggestion),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Não foi possível gerar sugestão");
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
