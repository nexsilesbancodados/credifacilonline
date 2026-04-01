import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatLocalDate, addMonthsToDateStr } from "@/lib/dateUtils";

interface RenegotiationData {
  clientId: string;
  originalContractId: string;
  pendingAmount: number;
  newInstallments: number;
  newRate: number;
  newInstallmentValue: number;
  totalNewAmount: number;
}

export function useRenegotiation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const renegotiateMutation = useMutation({
    mutationFn: async (data: RenegotiationData) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Mark original contract as renegotiated
      const { error: updateError } = await supabase
        .from("contracts")
        .update({ status: "Renegociado" })
        .eq("id", data.originalContractId);

      if (updateError) throw updateError;

      // 2. Mark remaining installments as cancelled (update to Renegociado)
      const { error: installmentsError } = await supabase
        .from("installments")
        .update({ status: "Pago" }) // Mark as paid to close them
        .eq("contract_id", data.originalContractId)
        .in("status", ["Pendente", "Atrasado"]);

      if (installmentsError) throw installmentsError;

      // 3. Create new renegotiated contract
      const startDate = formatLocalDate(new Date());
      const firstDueDate = formatLocalDate(addMonths(new Date(), 1));

      const { data: newContract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          client_id: data.clientId,
          operator_id: user.id,
          capital: data.pendingAmount,
          interest_rate: data.newRate,
          installments: data.newInstallments,
          installment_value: data.newInstallmentValue,
          total_amount: data.totalNewAmount,
          total_profit: data.totalNewAmount - data.pendingAmount,
          frequency: "mensal",
          start_date: startDate,
          first_due_date: firstDueDate,
          status: "Ativo",
          renegotiated_from_id: data.originalContractId,
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // 4. Create new installments
      const installments = [];
      let dueDate = parseLocalDate(firstDueDate);

      for (let i = 1; i <= data.newInstallments; i++) {
        installments.push({
          contract_id: newContract.id,
          client_id: data.clientId,
          operator_id: user.id,
          installment_number: i,
          total_installments: data.newInstallments,
          due_date: formatLocalDate(dueDate),
          amount_due: data.newInstallmentValue,
          amount_paid: 0,
          payment_date: null,
          status: "Pendente",
          fine: 0,
        });
        dueDate = addMonths(dueDate, 1);
      }

      const { error: newInstallmentsError } = await supabase
        .from("installments")
        .insert(installments);

      if (newInstallmentsError) throw newInstallmentsError;

      // 5. Log activity
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: data.clientId,
        contract_id: newContract.id,
        type: "renegotiation",
        description: `Renegociação realizada - ${data.newInstallments}x de R$ ${data.newInstallmentValue.toLocaleString("pt-BR")}`,
        metadata: {
          original_contract_id: data.originalContractId,
          pending_amount: data.pendingAmount,
          new_rate: data.newRate,
        },
      });

      // 6. Update client status to Ativo
      await supabase
        .from("clients")
        .update({ status: "Ativo" })
        .eq("id", data.clientId);

      return newContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Renegociação concluída!",
        description: "O novo contrato foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na renegociação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    renegotiate: renegotiateMutation.mutateAsync,
    isRenegotiating: renegotiateMutation.isPending,
  };
}
