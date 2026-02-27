import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
  if (!EVOLUTION_API_URL) {
    return new Response(JSON.stringify({ error: 'EVOLUTION_API_URL not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  if (!EVOLUTION_API_KEY) {
    return new Response(JSON.stringify({ error: 'EVOLUTION_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '');

  try {
    const { action, instanceName, number, ...params } = await req.json();

    const headers = {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    };

    let url: string;
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      case 'create_instance': {
        url = `${baseUrl}/instance/create`;
        method = 'POST';
        body = JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          reject_call: false,
          chatwoot_sign_msg: false,
          ...params,
        });
        break;
      }

      case 'list_instances': {
        url = `${baseUrl}/instance/fetchInstances`;
        break;
      }

      case 'get_instance': {
        url = `${baseUrl}/instance/connectionState/${instanceName}`;
        break;
      }

      case 'connect_instance': {
        url = `${baseUrl}/instance/connect/${instanceName}`;
        break;
      }

      case 'logout_instance': {
        url = `${baseUrl}/instance/logout/${instanceName}`;
        method = 'DELETE';
        break;
      }

      case 'delete_instance': {
        url = `${baseUrl}/instance/delete/${instanceName}`;
        method = 'DELETE';
        break;
      }

      case 'restart_instance': {
        url = `${baseUrl}/instance/restart/${instanceName}`;
        method = 'PUT';
        break;
      }

      case 'send_text': {
        url = `${baseUrl}/message/sendText/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          number,
          text: params.text,
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const fetchOptions: RequestInit = { method, headers };
    if (body) fetchOptions.body = body;

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error(`Evolution API error [${response.status}]:`, data);
      return new Response(JSON.stringify({ error: 'Evolution API error', details: data }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Evolution API function error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
