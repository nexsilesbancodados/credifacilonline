import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { CollectionRules } from "@/components/settings/CollectionRules";
import { MessageTemplates } from "@/components/templates/MessageTemplates";
import { ExportData } from "@/components/backup/ExportData";
import { ImportData } from "@/components/backup/ImportData";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import {
  User,
  Building2,
  Bell,
  Webhook,
  Bot,
  Shield,
  Save,
  Clock,
  Ruler,
  FileText,
  Database,
  MessageSquare,
  Loader2,
} from "lucide-react";

const Configuracoes = () => {
  const { toast } = useToast();
  const { settings, isLoading: isLoadingSettings, updateSettings, isUpdating } = useCompanySettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    name: "João Silva",
    email: "joao@empresa.com",
    phone: "(11) 99999-9999",
    company: "CrediFácil Ltda",
    cnpj: "12.345.678/0001-90",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailPayments: true,
    emailOverdue: true,
    pushPayments: false,
    pushOverdue: true,
    dailyReport: true,
    weeklyReport: true,
  });

  // N8N settings - now persisted
  const [n8nSettings, setN8nSettings] = useState({
    webhookUrl: "",
    activeEvents: {
      newContract: true,
      payment: true,
      overdue: false,
      renegotiation: true,
    },
  });

  // AI Agent settings - now persisted
  const [aiAgent, setAiAgent] = useState({
    isActive: false,
    startTime: "09:00",
    endTime: "18:00",
    triggers: {
      day1: true,
      day3: true,
      day7: true,
      day15: false,
      day30: false,
    },
  });

  // Sync N8N and AI Agent settings with database
  useEffect(() => {
    if (settings) {
      setN8nSettings({
        webhookUrl: settings.n8n_webhook_url || "",
        activeEvents: settings.n8n_active_events || {
          newContract: true,
          payment: true,
          overdue: false,
          renegotiation: true,
        },
      });
      setAiAgent({
        isActive: settings.ai_agent_active || false,
        startTime: settings.ai_agent_start_time || "09:00",
        endTime: settings.ai_agent_end_time || "18:00",
        triggers: settings.ai_agent_triggers || {
          day1: true,
          day3: true,
          day7: true,
          day15: false,
          day30: false,
        },
      });
    }
  }, [settings]);

  const handleSave = (section: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configurações salvas!",
        description: `As configurações de ${section} foram atualizadas com sucesso.`,
      });
    }, 1000);
  };

  const handleSaveN8N = () => {
    updateSettings({
      n8n_webhook_url: n8nSettings.webhookUrl || null,
      n8n_active_events: n8nSettings.activeEvents,
    });
  };

  const handleSaveAIAgent = () => {
    updateSettings({
      ai_agent_active: aiAgent.isActive,
      ai_agent_start_time: aiAgent.startTime,
      ai_agent_end_time: aiAgent.endTime,
      ai_agent_triggers: aiAgent.triggers,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências e integrações
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="collection-rules" className="gap-2">
              <Ruler className="w-4 h-4" />
              Régua
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Database className="w-4 h-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="n8n" className="gap-2">
              <Webhook className="w-4 h-4" />
              N8N
            </TabsTrigger>
            <TabsTrigger value="ai-agent" className="gap-2">
              <Bot className="w-4 h-4" />
              Agente IA
            </TabsTrigger>
          </TabsList>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            <WhatsAppSettings />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Atualize seus dados pessoais e de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Segurança</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha atual</Label>
                      <Input id="currentPassword" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova senha</Label>
                      <Input id="newPassword" type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => handleSave("perfil")}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <CompanySettingsForm />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Push Notifications Card */}
            <PushNotificationSettings />

            {/* Email Notifications Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notificações por Email
                  </CardTitle>
                  <CardDescription>
                    Configure alertas por email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pagamentos recebidos</p>
                        <p className="text-sm text-muted-foreground">Receba um email quando um pagamento for registrado</p>
                      </div>
                      <Switch
                        checked={notifications.emailPayments}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailPayments: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Parcelas atrasadas</p>
                        <p className="text-sm text-muted-foreground">Receba alertas sobre parcelas vencidas</p>
                      </div>
                      <Switch
                        checked={notifications.emailOverdue}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailOverdue: checked })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Relatórios Automáticos</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Relatório diário</p>
                          <p className="text-sm text-muted-foreground">Resumo diário da carteira</p>
                        </div>
                        <Switch
                          checked={notifications.dailyReport}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReport: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Relatório semanal</p>
                          <p className="text-sm text-muted-foreground">Análise semanal completa</p>
                        </div>
                        <Switch
                          checked={notifications.weeklyReport}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => handleSave("notificações")}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Collection Rules Tab */}
          <TabsContent value="collection-rules">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CollectionRules />
            </motion.div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Modelos de Mensagem
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie templates de mensagens para cobrança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsTemplatesOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerenciar Templates
                  </Button>
                </CardContent>
              </Card>
              <MessageTemplates open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen} />
            </motion.div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ExportData />
              <ImportData />
            </motion.div>
          </TabsContent>

          {/* N8N Tab */}
          <TabsContent value="n8n">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Webhook Endpoint Card */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    Endpoint de Cobrança Automática
                  </CardTitle>
                  <CardDescription>
                    Use este endpoint no n8n para disparar cobranças automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>URL do Webhook (use no n8n)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook`}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook`);
                          toast({ title: "URL copiada!" });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
                    <h4 className="font-semibold text-sm">📋 Ações Disponíveis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded-lg bg-background/50">
                        <code className="text-primary">get_pending_clients</code>
                        <p className="text-muted-foreground text-xs mt-1">
                          Lista todos os clientes com parcelas pendentes/atrasadas
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <code className="text-primary">generate_messages</code>
                        <p className="text-muted-foreground text-xs mt-1">
                          Gera mensagens de cobrança para clientes selecionados
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <code className="text-primary">log_sent</code>
                        <p className="text-muted-foreground text-xs mt-1">
                          Registra que mensagens foram enviadas
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Limite de Mensagens
                    </h4>
                    <div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
                      <p className="text-sm font-medium text-warning-foreground">
                        ⚠️ Máximo de 20 mensagens por hora
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure seu workflow n8n com um delay de 3 minutos entre cada mensagem para respeitar este limite.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* n8n Workflow Instructions */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Como Configurar no n8n
                  </CardTitle>
                  <CardDescription>
                    Siga estes passos para criar um workflow de cobrança automática
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                      <div>
                        <p className="font-medium text-sm">Crie um Schedule Trigger</p>
                        <p className="text-xs text-muted-foreground">Configure para rodar diariamente (ex: 9h da manhã)</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                      <div>
                        <p className="font-medium text-sm">Adicione HTTP Request para buscar clientes</p>
                        <p className="text-xs text-muted-foreground">POST para o webhook com {"{"}"action": "get_pending_clients"{"}"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                      <div>
                        <p className="font-medium text-sm">Filtre clientes (máx. 20)</p>
                        <p className="text-xs text-muted-foreground">Use um nó Limit para limitar a 20 clientes por execução</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
                      <div>
                        <p className="font-medium text-sm">Gere as mensagens</p>
                        <p className="text-xs text-muted-foreground">POST com {"{"}"action": "generate_messages", "client_ids": [...], "tone": "amigavel"{"}"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">5</div>
                      <div>
                        <p className="font-medium text-sm">Envie via WhatsApp</p>
                        <p className="text-xs text-muted-foreground">Use Evolution API, Z-API ou WhatsApp Business API com delay de 3 min entre cada</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Exemplo de Payload</Label>
                    <pre className="p-3 rounded-lg bg-secondary/50 text-xs font-mono overflow-x-auto">
{`// 1. Buscar clientes pendentes
POST /functions/v1/n8n-webhook
{
  "action": "get_pending_clients"
}

// 2. Gerar mensagens para cobrança
POST /functions/v1/n8n-webhook
{
  "action": "generate_messages",
  "client_ids": ["uuid1", "uuid2"],
  "tone": "amigavel"  // amigavel, formal, urgente
}

// 3. Mensagem customizada (opcional)
{
  "action": "generate_messages",
  "client_ids": ["uuid1"],
  "custom_message": "Olá {nome}, sua parcela de {valor} vence em {vencimento}"
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Rate Limit: 20 mensagens/hora</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Para respeitar o limite de 20 mensagens por hora, configure seu workflow n8n da seguinte forma:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                        <li>Use um nó <strong>Limit</strong> para processar apenas 20 clientes por execução</li>
                        <li>Adicione um nó <strong>Wait</strong> de 3 minutos entre cada envio</li>
                        <li>Ou agende o workflow para rodar a cada hora com 20 clientes diferentes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* AI Agent Tab */}
          <TabsContent value="ai-agent">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Agente de Cobrança IA
                  </CardTitle>
                  <CardDescription>
                    Configure o agente autônomo para cobranças automáticas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div>
                      <p className="font-semibold text-primary">Status do Agente</p>
                      <p className="text-sm text-muted-foreground">
                        {aiAgent.isActive ? "O agente está ativo e funcionando" : "O agente está desativado"}
                      </p>
                    </div>
                    <Switch
                      checked={aiAgent.isActive}
                      onCheckedChange={(checked) => setAiAgent({ ...aiAgent, isActive: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Horário de Funcionamento</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input
                          type="time"
                          value={aiAgent.startTime}
                          onChange={(e) => setAiAgent({ ...aiAgent, startTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input
                          type="time"
                          value={aiAgent.endTime}
                          onChange={(e) => setAiAgent({ ...aiAgent, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      O agente só enviará mensagens dentro deste horário
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Gatilhos de Cobrança</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione quando o agente deve enviar mensagens de cobrança
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: "day1", label: "1 dia de atraso" },
                        { key: "day3", label: "3 dias de atraso" },
                        { key: "day7", label: "7 dias de atraso" },
                        { key: "day15", label: "15 dias de atraso" },
                        { key: "day30", label: "30 dias de atraso" },
                      ].map((trigger) => (
                        <div
                          key={trigger.key}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            aiAgent.triggers[trigger.key as keyof typeof aiAgent.triggers]
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setAiAgent({
                              ...aiAgent,
                              triggers: {
                                ...aiAgent.triggers,
                                [trigger.key]: !aiAgent.triggers[trigger.key as keyof typeof aiAgent.triggers],
                              },
                            })
                          }
                        >
                          <p className="font-medium text-center">{trigger.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveAIAgent}
                      disabled={isUpdating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
