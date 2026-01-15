import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollectionRules, CollectionRule } from "@/hooks/useCollectionRules";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Smile,
  BriefcaseBusiness,
  Zap,
} from "lucide-react";

const toneOptions = [
  { value: 'friendly', label: 'Amigável', icon: Smile, color: 'bg-green-500/10 text-green-500' },
  { value: 'formal', label: 'Formal', icon: BriefcaseBusiness, color: 'bg-blue-500/10 text-blue-500' },
  { value: 'urgent', label: 'Urgente', icon: AlertTriangle, color: 'bg-red-500/10 text-red-500' },
];

const defaultTemplates = {
  friendly: "Olá {nome}! 😊 Lembrando que sua parcela de R$ {valor} vence em {dias}. Qualquer dúvida, estou à disposição!",
  formal: "Prezado(a) {nome}, informamos que sua parcela no valor de R$ {valor} possui vencimento em {dias}. Em caso de dúvidas, entre em contato.",
  urgent: "⚠️ ATENÇÃO {nome}! Sua parcela de R$ {valor} está vencida há {dias}. Regularize imediatamente para evitar juros e restrições.",
};

interface RuleFormData {
  name: string;
  trigger_days: number;
  message_template: string;
  tone: 'friendly' | 'formal' | 'urgent';
  is_active: boolean;
}

export function CollectionRules() {
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleRule } = useCollectionRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CollectionRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CollectionRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    trigger_days: -3,
    message_template: defaultTemplates.friendly,
    tone: 'friendly',
    is_active: true,
  });

  const handleOpenDialog = (rule?: CollectionRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        trigger_days: rule.trigger_days,
        message_template: rule.message_template,
        tone: rule.tone,
        is_active: rule.is_active,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        trigger_days: -3,
        message_template: defaultTemplates.friendly,
        tone: 'friendly',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleToneChange = (tone: 'friendly' | 'formal' | 'urgent') => {
    setFormData(prev => ({
      ...prev,
      tone,
      message_template: defaultTemplates[tone],
    }));
  };

  const handleSubmit = async () => {
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, ...formData });
    } else {
      await createRule.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteRule.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const getTriggerLabel = (days: number): string => {
    if (days === 0) return 'No dia do vencimento';
    if (days < 0) return `${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''} antes`;
    return `${days} dia${days > 1 ? 's' : ''} após vencimento`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Régua de Cobrança
            </CardTitle>
            <CardDescription>
              Configure quando enviar lembretes e cobranças automáticas
            </CardDescription>
          </div>
          <PermissionGate permission="canManageSettings">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Editar Regra' : 'Nova Regra de Cobrança'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label>Nome da Regra</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Lembrete 3 dias antes"
                    />
                  </div>

                  {/* Trigger Days */}
                  <div className="space-y-2">
                    <Label>Quando disparar</Label>
                    <Select
                      value={formData.trigger_days.toString()}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, trigger_days: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-7">7 dias antes</SelectItem>
                        <SelectItem value="-3">3 dias antes</SelectItem>
                        <SelectItem value="-1">1 dia antes</SelectItem>
                        <SelectItem value="0">No dia do vencimento</SelectItem>
                        <SelectItem value="1">1 dia após</SelectItem>
                        <SelectItem value="3">3 dias após</SelectItem>
                        <SelectItem value="7">7 dias após</SelectItem>
                        <SelectItem value="15">15 dias após</SelectItem>
                        <SelectItem value="30">30 dias após</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <Label>Tom da Mensagem</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {toneOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleToneChange(option.value as any)}
                          className={`
                            p-3 rounded-lg border-2 transition-all text-center
                            ${formData.tone === option.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                            }
                          `}
                        >
                          <option.icon className={`h-5 w-5 mx-auto mb-1 ${option.color.split(' ')[1]}`} />
                          <span className="text-xs font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Template */}
                  <div className="space-y-2">
                    <Label>Template da Mensagem</Label>
                    <Textarea
                      value={formData.message_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                      rows={4}
                      placeholder="Use {nome}, {valor}, {dias} como variáveis"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{nome}'}, {'{valor}'}, {'{dias}'}, {'{vencimento}'}
                    </p>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>Regra Ativa</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.name || createRule.isPending || updateRule.isPending}
                    >
                      {(createRule.isPending || updateRule.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {editingRule ? 'Salvar' : 'Criar Regra'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma regra configurada</p>
            <p className="text-sm">Crie regras para automatizar suas cobranças</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {rules.map((rule, index) => {
                const toneConfig = toneOptions.find(t => t.value === rule.tone) || toneOptions[0];
                const ToneIcon = toneConfig.icon;

                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg border
                      ${rule.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'}
                    `}
                  >
                    {/* Trigger Indicator */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-lg
                      ${rule.trigger_days < 0 
                        ? 'bg-blue-500/10 text-blue-500' 
                        : rule.trigger_days === 0 
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }
                    `}>
                      <Clock className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.name}</p>
                        <Badge variant="outline" className={toneConfig.color}>
                          <ToneIcon className="h-3 w-3 mr-1" />
                          {toneConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getTriggerLabel(rule.trigger_days)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {rule.message_template.substring(0, 60)}...
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_active: checked })}
                      />
                      <PermissionGate permission="canManageSettings">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(rule)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Automação via Webhook</p>
              <p className="text-xs text-muted-foreground mt-1">
                As regras de cobrança podem ser integradas com n8n ou outras ferramentas de automação 
                para envio automático via WhatsApp Business API.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              A regra "{deleteConfirm?.name}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRule.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
