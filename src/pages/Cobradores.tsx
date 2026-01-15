import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Plus,
  Users,
  Phone,
  Mail,
  Link,
  Copy,
  Trash2,
  Edit,
  UserPlus,
  Loader2,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectors } from "@/hooks/useCollectors";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Cobradores = () => {
  const { collectorsWithClients, isLoading, createCollector, updateCollector, deleteCollector, assignClient, regenerateToken } = useCollectors();
  const { clients } = useClients();
  const { toast } = useToast();

  const [showNewCollector, setShowNewCollector] = useState(false);
  const [showEditCollector, setShowEditCollector] = useState(false);
  const [showAssignClient, setShowAssignClient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const unassignedClients = clients.filter(c => !c.collector_id && !c.archived_at);

  const handleCreateCollector = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do cobrador.",
        variant: "destructive",
      });
      return;
    }

    await createCollector.mutateAsync({
      name: formData.name,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
    });

    setFormData({ name: "", phone: "", email: "" });
    setShowNewCollector(false);
  };

  const handleEditCollector = async () => {
    if (!selectedCollector || !formData.name.trim()) return;

    await updateCollector.mutateAsync({
      id: selectedCollector,
      name: formData.name,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
    });

    setShowEditCollector(false);
    setSelectedCollector(null);
    setFormData({ name: "", phone: "", email: "" });
  };

  const handleDeleteCollector = async () => {
    if (!selectedCollector) return;
    await deleteCollector.mutateAsync(selectedCollector);
    setShowDeleteConfirm(false);
    setSelectedCollector(null);
  };

  const handleAssignClient = async () => {
    if (!selectedCollector || !selectedClientId) return;

    await assignClient.mutateAsync({
      clientId: selectedClientId,
      collectorId: selectedCollector,
    });

    setShowAssignClient(false);
    setSelectedClientId("");
  };

  const handleUnassignClient = async (clientId: string) => {
    await assignClient.mutateAsync({
      clientId,
      collectorId: null,
    });
  };

  const copyExternalLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/cobrador/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link de acesso foi copiado para a área de transferência.",
    });
  };

  const openExternalLink = (token: string) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/cobrador/${token}`, "_blank");
  };

  const openEdit = (collector: any) => {
    setSelectedCollector(collector.id);
    setFormData({
      name: collector.name,
      phone: collector.phone || "",
      email: collector.email || "",
    });
    setShowEditCollector(true);
  };

  const openAssign = (collectorId: string) => {
    setSelectedCollector(collectorId);
    setShowAssignClient(true);
  };

  const openDelete = (collectorId: string) => {
    setSelectedCollector(collectorId);
    setShowDeleteConfirm(true);
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    await updateCollector.mutateAsync({
      id,
      is_active: !currentState,
    });
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Cobradores
            </h1>
            <p className="mt-1 text-muted-foreground">
              Cadastre cobradores e atribua clientes para eles cobrarem
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewCollector(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
          >
            <Plus className="h-5 w-5" />
            Novo Cobrador
          </motion.button>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando cobradores...</p>
        </div>
      ) : collectorsWithClients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <Users className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Nenhum cobrador cadastrado
          </p>
          <p className="text-sm text-muted-foreground">
            Clique em "Novo Cobrador" para começar
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collectorsWithClients.map((collector, index) => (
            <motion.div
              key={collector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                "rounded-2xl border p-6 transition-all",
                collector.is_active
                  ? "border-border/50 bg-card hover:border-primary/30"
                  : "border-border/30 bg-card/50 opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {collector.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{collector.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {collector.is_active ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(collector)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDelete(collector.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {collector.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {collector.phone}
                  </div>
                )}
                {collector.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {collector.email}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/30">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {collector.clients_count} cliente(s) atribuído(s)
                </span>
              </div>

              {/* External Link Actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyExternalLink(collector.access_token)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openExternalLink(collector.access_token)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => regenerateToken.mutateAsync(collector.id)}
                  title="Regenerar token"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Client List */}
              {collector.clients.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Clientes atribuídos:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {collector.clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-sm"
                      >
                        <span className="truncate">{client.name}</span>
                        <button
                          onClick={() => handleUnassignClient(client.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover atribuição"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openAssign(collector.id)}
                  disabled={unassignedClients.length === 0}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Atribuir Cliente
                </Button>
                <Button
                  variant={collector.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(collector.id, collector.is_active)}
                >
                  {collector.is_active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Collector Dialog */}
      <Dialog open={showNewCollector} onOpenChange={setShowNewCollector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cobrador</DialogTitle>
            <DialogDescription>
              Cadastre um novo cobrador para atribuir clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do cobrador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCollector(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCollector} disabled={createCollector.isPending}>
              {createCollector.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Cobrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collector Dialog */}
      <Dialog open={showEditCollector} onOpenChange={setShowEditCollector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cobrador</DialogTitle>
            <DialogDescription>
              Atualize os dados do cobrador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do cobrador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCollector(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCollector} disabled={updateCollector.isPending}>
              {updateCollector.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Client Dialog */}
      <Dialog open={showAssignClient} onOpenChange={setShowAssignClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Cliente</DialogTitle>
            <DialogDescription>
              Selecione um cliente para atribuir a este cobrador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignedClients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os clientes já estão atribuídos a cobradores.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignClient(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignClient}
              disabled={!selectedClientId || assignClient.isPending}
            >
              {assignClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cobrador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cobrador? Os clientes atribuídos serão desvinculados.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCollector}
              disabled={deleteCollector.isPending}
            >
              {deleteCollector.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Cobradores;
