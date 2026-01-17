import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

type ActivityType = 
  | "client_created" 
  | "client_updated" 
  | "client_deleted"
  | "contract_created" 
  | "contract_updated"
  | "payment_received"
  | "renegotiation_created"
  | "collection_sent"
  | "system";

interface LogActivityParams {
  type: ActivityType;
  description: string;
  clientId?: string;
  contractId?: string;
  metadata?: Record<string, unknown>;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = async ({
    type,
    description,
    clientId,
    contractId,
    metadata,
  }: LogActivityParams) => {
    if (!user) return;

    try {
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        type: type.includes("client") ? "client" : 
              type.includes("contract") ? "contract" :
              type.includes("payment") ? "payment" :
              type.includes("renegotiation") ? "renegotiation" :
              type.includes("collection") ? "collection" : "system",
        description,
        client_id: clientId || null,
        contract_id: contractId || null,
        metadata: (metadata as Json) || null,
      });
    } catch {
      // Error logging activity silently
    }
  };

  return { logActivity };
}
