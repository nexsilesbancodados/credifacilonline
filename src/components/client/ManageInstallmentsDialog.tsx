import { useState } from "react";
import { parseLocalDate } from "@/lib/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trash2, 
  Edit2, 
  Save, 
  Plus, 
  AlertTriangle,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  fine: number;
  contract_id: string;
  client_id: string;
}

interface ManageInstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: Installment[];
  clientName: string;
  contractId: string;
}

export const ManageInstallmentsDialog = ({ 
  open, 
  onOpenChange, 
  installments,
  clientName,
  contractId
}: ManageInstallmentsDialogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Installment>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstallment, setNewInstallment] = useState({
    due_date: "",
    amount_due: 0,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const statusConfig = {
    Pago: { color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
    Pendente: { color: "text-primary", bg: "bg-primary/10", icon: Clock },
    Atrasado: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle },
  };

  const handleEdit = (installment: Installment) => {
    setEditingId(installment.id);
    setEditData({
      due_date: installment.due_date,
      amount_due: installment.amount_due,
      amount_paid: installment.amount_paid,
      status: installment.status,
      fine: installment.fine,
    });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("installments")
        .update({
          due_date: editData.due_date,
          amount_due: editData.amount_due,
          amount_paid: editData.amount_paid,
          status: editData.status,
          fine: editData.fine,
        })
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      
      toast({
        title: "Parcela atualizada!",
        description: "As alterações foram salvas.",
      });
      
      setEditingId(null);
      setEditData({});
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a parcela.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      // Delete related treasury transactions first
      await supabase
        .from("treasury_transactions")
        .delete()
        .eq("reference_id", id)
        .eq("reference_type", "installment");

      const { error } = await supabase
        .from("installments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update remaining installment numbers
      const remainingInstallments = installments
        .filter(i => i.id !== id)
        .sort((a, b) => a.installment_number - b.installment_number);

      for (let i = 0; i < remainingInstallments.length; i++) {
        await supabase
          .from("installments")
          .update({ 
            installment_number: i + 1,
            total_installments: remainingInstallments.length,
          })
          .eq("id", remainingInstallments[i].id);
      }

      // Update contract installments count
      await supabase
        .from("contracts")
        .update({ installments: remainingInstallments.length })
        .eq("id", contractId);

      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      
      toast({
        title: "Parcela excluída!",
        description: "A parcela foi removida do contrato.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a parcela.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddInstallment = async () => {
    if (!newInstallment.due_date || newInstallment.amount_due <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha a data e o valor corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newNumber = installments.length + 1;
      const clientId = installments[0]?.client_id;

      const { error } = await supabase.from("installments").insert({
        contract_id: contractId,
        client_id: clientId,
        operator_id: user?.id,
        installment_number: newNumber,
        total_installments: newNumber,
        due_date: newInstallment.due_date,
        amount_due: newInstallment.amount_due,
        amount_paid: 0,
        status: "Pendente",
        fine: 0,
      });

      if (error) throw error;

      // Update all installments with new total
      for (const inst of installments) {
        await supabase
          .from("installments")
          .update({ total_installments: newNumber })
          .eq("id", inst.id);
      }

      // Update contract
      await supabase
        .from("contracts")
        .update({ installments: newNumber })
        .eq("id", contractId);

      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      toast({
        title: "Parcela adicionada!",
        description: `Parcela ${newNumber} criada com sucesso.`,
      });

      setShowAddForm(false);
      setNewInstallment({ due_date: "", amount_due: 0 });
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível criar a parcela.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const sortedInstallments = [...installments].sort((a, b) => a.installment_number - b.installment_number);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-3xl rounded-2xl border border-border/50 bg-card p-6 shadow-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Gerenciar Parcelas
              </h2>
              <p className="text-sm text-muted-foreground">
                {clientName} - {sortedInstallments.length} parcelas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </motion.button>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <h3 className="text-sm font-semibold text-primary">Nova Parcela</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Vencimento</label>
                      <input
                        type="date"
                        value={newInstallment.due_date}
                        onChange={(e) => setNewInstallment({ ...newInstallment, due_date: e.target.value })}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Valor</label>
                      <input
                        type="number"
                        value={newInstallment.amount_due || ""}
                        onChange={(e) => setNewInstallment({ ...newInstallment, amount_due: Number(e.target.value) })}
                        step={0.01}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddInstallment}
                      disabled={isSaving}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Installments List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {sortedInstallments.map((installment) => {
              const config = statusConfig[installment.status as keyof typeof statusConfig] || statusConfig.Pendente;
              const Icon = config.icon;
              const isEditing = editingId === installment.id;

              return (
                <motion.div
                  key={installment.id}
                  layout
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    isEditing ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Parcela {installment.installment_number}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditData({});
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSave(installment.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Salvar
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Vencimento</label>
                          <input
                            type="date"
                            value={editData.due_date || ""}
                            onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                            className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Valor</label>
                          <input
                            type="number"
                            value={editData.amount_due || ""}
                            onChange={(e) => setEditData({ ...editData, amount_due: Number(e.target.value) })}
                            step={0.01}
                            className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Pago</label>
                          <input
                            type="number"
                            value={editData.amount_paid || ""}
                            onChange={(e) => setEditData({ ...editData, amount_paid: Number(e.target.value) })}
                            step={0.01}
                            className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Status</label>
                          <select
                            value={editData.status || ""}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Pago">Pago</option>
                            <option value="Atrasado">Atrasado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bg)}>
                          <Icon className={cn("h-5 w-5", config.color)} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Parcela {installment.installment_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Venc: {new Date(installment.due_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-display font-semibold text-foreground">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount_due)}
                          </p>
                          {installment.amount_paid > 0 && installment.status !== "Pago" && (
                            <p className="text-xs text-success">
                              Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount_paid)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(installment)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(installment.id)}
                            disabled={isDeleting === installment.id}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                            title="Excluir"
                          >
                            {isDeleting === installment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
