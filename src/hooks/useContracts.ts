import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addDays, addWeeks, addMonths, getDay } from "date-fns";
import { saveContractPDFToDocuments } from "@/lib/saveContractDocument";
import { LoanContractData } from "@/lib/generateLoanContract";

export interface Contract {
  id: string;
  client_id: string;
  operator_id: string;
  capital: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  total_profit: number;
  frequency: "diario" | "semanal" | "mensal" | "quinzenal" | "programada";
  daily_type?: "seg-seg" | "seg-sex" | "seg-sab" | null;
  scheduled_days?: number[] | null;
  start_date: string;
  first_due_date: string;
  status: "Ativo" | "Atraso" | "Quitado" | "Renegociado";
  renegotiated_from_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  contract_id: string;
  client_id: string;
  operator_id: string;
  installment_number: number;
  total_installments: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  payment_date: string | null;
  status: "Pendente" | "Pago" | "Atrasado" | "Agendado";
  fine: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContractData {
  client_id: string;
  capital: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  total_profit: number;
  frequency: "diario" | "semanal" | "mensal" | "quinzenal" | "programada";
  daily_type?: "seg-seg" | "seg-sex" | "seg-sab";
  scheduled_days?: number[];
  start_date: string;
  first_due_date: string;
  paid_installments?: number;
  fine_percentage?: number;
  daily_interest_rate?: number;
  // Client data for contract PDF
  client_name?: string;
  client_cpf?: string;
  client_city?: string;
  client_state?: string;
  company_name?: string;
}

// Check if a date is valid for daily collection based on dailyType
function isValidCollectionDay(date: Date, dailyType: string): boolean {
  const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  switch (dailyType) {
    case "seg-seg": // Monday to Monday (all days)
      return true;
    case "seg-sex": // Monday to Friday (weekdays only)
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "seg-sab": // Monday to Saturday (no Sunday)
      return dayOfWeek >= 1 && dayOfWeek <= 6;
    default:
      return true;
  }
}

function getNextDueDate(currentDate: Date, frequency: string, dailyType?: string): Date {
  let nextDate: Date;
  
  switch (frequency) {
    case "diario":
      nextDate = addDays(currentDate, 1);
      // Skip invalid days for daily frequency
      if (dailyType && dailyType !== "seg-seg") {
        while (!isValidCollectionDay(nextDate, dailyType)) {
          nextDate = addDays(nextDate, 1);
        }
      }
      return nextDate;
    case "semanal":
      return addWeeks(currentDate, 1);
    case "quinzenal":
      return addDays(currentDate, 15);
    case "mensal":
    default:
      return addMonths(currentDate, 1);
  }
}

// Parse date string "YYYY-MM-DD" as local date (avoids UTC timezone shift)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function useContracts(clientId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ["contracts", clientId],
    queryFn: async () => {
      let query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });

  const createContractMutation = useMutation({
    mutationFn: async (contractData: CreateContractData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { 
        paid_installments = 0, 
        client_name, 
        client_cpf, 
        client_city, 
        client_state,
        company_name,
        fine_percentage = 2,
        daily_interest_rate = 0.033,
        scheduled_days,
        ...contractFields 
      } = contractData;

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          ...contractFields,
          operator_id: user.id,
          fine_percentage,
          daily_interest_rate,
          scheduled_days: scheduled_days || null,
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Create installments
      const installments = [];

      if (contractData.frequency === "programada" && scheduled_days && scheduled_days.length > 0) {
        // For "programada": generate installments on specific days of the month
        const sortedDays = [...scheduled_days].sort((a, b) => a - b);
        const startDate = parseLocalDate(contractData.first_due_date);
        let currentYear = startDate.getFullYear();
        
        // Find the first scheduled day >= start date's day
        let dayIndex = sortedDays.findIndex(d => d >= startDate.getDate());
        if (dayIndex === -1) {
          // All days are before start date's day, go to next month
          dayIndex = 0;
          currentMonth++;
          if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        }

        for (let i = 1; i <= contractData.installments; i++) {
          const day = sortedDays[dayIndex];
          // Clamp day to max days in month
          const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          const clampedDay = Math.min(day, maxDay);
          const dueDate = new Date(currentYear, currentMonth, clampedDay);
          
          const isPaid = i <= paid_installments;
          installments.push({
            contract_id: contract.id,
            client_id: contractData.client_id,
            operator_id: user.id,
            installment_number: i,
            total_installments: contractData.installments,
            due_date: dueDate.toISOString().split("T")[0],
            amount_due: contractData.installment_value,
            amount_paid: isPaid ? contractData.installment_value : 0,
            payment_date: isPaid ? new Date().toISOString().split("T")[0] : null,
            status: isPaid ? "Pago" : "Pendente",
            fine: 0,
          });

          // Advance to next scheduled day
          dayIndex++;
          if (dayIndex >= sortedDays.length) {
            dayIndex = 0;
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
          }
        }
      } else {
        // Standard frequency-based installment generation
        let dueDate = parseLocalDate(contractData.first_due_date);

        for (let i = 1; i <= contractData.installments; i++) {
          const isPaid = i <= paid_installments;
          installments.push({
            contract_id: contract.id,
            client_id: contractData.client_id,
            operator_id: user.id,
            installment_number: i,
            total_installments: contractData.installments,
            due_date: dueDate.toISOString().split("T")[0],
            amount_due: contractData.installment_value,
            amount_paid: isPaid ? contractData.installment_value : 0,
            payment_date: isPaid ? new Date().toISOString().split("T")[0] : null,
            status: isPaid ? "Pago" : "Pendente",
            fine: 0,
          });
          dueDate = getNextDueDate(dueDate, contractData.frequency, contractData.daily_type);
        }
      }

      const { error: installmentsError } = await supabase
        .from("installments")
        .insert(installments);

      if (installmentsError) throw installmentsError;

      // Create treasury transaction for loan disbursement
      await supabase.from("treasury_transactions").insert({
        operator_id: user.id,
        date: contractData.start_date,
        description: `Empréstimo - Cliente ID: ${contractData.client_id}`,
        category: "Empréstimo",
        type: "saida",
        amount: contractData.capital,
        reference_id: contract.id,
        reference_type: "contract",
      });

      // Log activity
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: contractData.client_id,
        contract_id: contract.id,
        type: "contract_created",
        description: `Contrato criado - R$ ${contractData.capital.toLocaleString("pt-BR")} em ${contractData.installments}x`,
      });

      // Generate and save contract PDF to documents
      if (client_name && client_cpf) {
        const pdfData: LoanContractData = {
          contractId: contract.id,
          creditorName: company_name || "Credifacil Global",
          clientName: client_name,
          clientCpf: client_cpf,
          startDate: contractData.start_date,
          capital: contractData.capital,
          installments: contractData.installments,
          installmentValue: contractData.installment_value,
          frequency: contractData.frequency,
          firstDueDate: contractData.first_due_date,
          finePercentage: fine_percentage,
          dailyInterestRate: daily_interest_rate,
          city: client_city,
          state: client_state,
        };

        const saveResult = await saveContractPDFToDocuments({
          contractId: contract.id,
          clientId: contractData.client_id,
          userId: user.id,
          contractData: pdfData,
        });

        if (!saveResult.success) {
          console.warn("Failed to save contract PDF:", saveResult.error);
          // Don't fail the contract creation, just log the warning
        }
      }

      return contract as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Contrato criado!",
        description: "O contrato e as parcelas foram gerados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract: createContractMutation.mutateAsync,
    isCreating: createContractMutation.isPending,
  };
}

export function useInstallments(clientId?: string, contractId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const installmentsQuery = useQuery({
    queryKey: ["installments", clientId, contractId],
    queryFn: async () => {
      let query = supabase
        .from("installments")
        .select("*")
        .order("due_date", { ascending: true });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      if (contractId) {
        query = query.eq("contract_id", contractId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!user,
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async ({
      installmentId,
      amountPaid,
      clientId,
    }: {
      installmentId: string;
      amountPaid: number;
      clientId: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: installment, error } = await supabase
        .from("installments")
        .update({
          amount_paid: amountPaid,
          payment_date: new Date().toISOString().split("T")[0],
          status: "Pago",
        })
        .eq("id", installmentId)
        .select()
        .single();

      if (error) throw error;

      // Create treasury transaction for payment received
      await supabase.from("treasury_transactions").insert({
        operator_id: user.id,
        date: new Date().toISOString().split("T")[0],
        description: `Recebimento de parcela`,
        category: "Recebimento",
        type: "entrada",
        amount: amountPaid,
        reference_id: installmentId,
        reference_type: "installment",
      });

      // Log activity
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: clientId,
        contract_id: installment.contract_id,
        type: "payment_received",
        description: `Pagamento recebido - R$ ${amountPaid.toLocaleString("pt-BR")}`,
      });

      return installment as Installment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Pagamento registrado!",
        description: "A parcela foi marcada como paga.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    installments: installmentsQuery.data || [],
    isLoading: installmentsQuery.isLoading,
    error: installmentsQuery.error,
    payInstallment: payInstallmentMutation.mutate,
    isPaying: payInstallmentMutation.isPending,
  };
}

export function usePendingInstallments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-installments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installments")
        .select(`
          *,
          clients!inner(name, whatsapp)
        `)
        .in("status", ["Pendente", "Atrasado"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
