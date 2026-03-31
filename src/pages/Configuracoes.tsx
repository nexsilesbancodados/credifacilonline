import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { CollectionRules } from "@/components/settings/CollectionRules";
import { MessageTemplates } from "@/components/templates/MessageTemplates";
import { ExportData } from "@/components/backup/ExportData";
import { ImportData } from "@/components/backup/ImportData";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { AIAgentSettings } from "@/components/settings/AIAgentSettings";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import {
  User,
  Building2,
  Bell,
  Webhook,
  Shield,
  Save,
  Ruler,
  FileText,
  Database,
  Loader2,
  CheckCircle,
  Copy,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Configuracoes = () => {
  const { toast } = useToast();
  const { profile, updateProfile } = useAuth();
  const { settings, isLoading: isLoadingSettings, updateSettings, isUpdating } = useCompanySettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Profile settings - initialize from auth context
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Sync profile data from auth context
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailPayments: true,
    emailOverdue: true,
    pushPayments: false,
    pushOverdue: true,
    dailyReport: true,
    weeklyReport: true,
  });

  // Webhook URL for n8n
  const [webhookUrl, setWebhookUrl] = useState("");

  // Sync webhook URL with settings
  useEffect(() => {
    if (settings?.n8n_webhook_url) {
      setWebhookUrl(settings.n8n_webhook_url);
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

  const handleSaveWebhook = () => {
    updateSettings({
      n8n_webhook_url: webhookUrl || null,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook`;

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas preferências e integrações
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-secondary/50 p-1 h-auto inline-flex min-w-max">
              <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2 text-xs sm:text-sm">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="collection-rules" className="gap-2 text-xs sm:text-sm">
                <Ruler className="w-4 h-4" />
                <span className="hidden sm:inline">Régua</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2 text-xs sm:text-sm">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="gap-2 text-xs sm:text-sm">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
              <TabsTrigger value="ai-agent" className="gap-2 text-xs sm:text-sm">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Agente IA</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 text-xs sm:text-sm">
                <Webhook className="w-4 h-4" />
                <span className="hidden sm:inline">Integrações</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
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

          {/* AI Agent Tab */}
          <TabsContent value="ai-agent">
            <AIAgentSettings />
          </TabsContent>

          {/* Integrations Tab (n8n + Evolution API) */}
          <TabsContent value="integrations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <Card className={`border-2 ${webhookUrl ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className={`w-8 h-8 ${webhookUrl ? "text-green-500" : "text-amber-500"}`} />
                    <div>
                      <h3 className="font-semibold">
                        {webhookUrl ? "Integração Configurada" : "Integração Não Configurada"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {webhookUrl 
                          ? "n8n está conectado para automações"
                          : "Configure o webhook do n8n abaixo"}
                      </p>
                    </div>
                    <Badge variant={webhookUrl ? "default" : "secondary"} className="ml-auto">
                      {webhookUrl ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Configuration */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    Integração n8n + Evolution API
                  </CardTitle>
                  <CardDescription>
                    Configure o webhook para automações de cobrança via WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* API Endpoint (read-only) */}
                  <div className="space-y-2">
                    <Label>Endpoint da API (use no n8n)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={apiEndpoint}
                        className="font-mono text-xs bg-secondary/30"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(apiEndpoint)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use este endpoint nas requisições HTTP do seu workflow n8n
                    </p>
                  </div>

                  <Separator />

                  {/* User's n8n Webhook URL (optional) */}
                  <div className="space-y-2">
                    <Label>URL do Webhook n8n (opcional)</Label>
                    <Input
                      placeholder="https://seu-n8n.com/webhook/xxx"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole aqui a URL do webhook do seu workflow n8n para referência
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveWebhook}
                      disabled={isUpdating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Available Actions */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle>Ações Disponíveis</CardTitle>
                  <CardDescription>
                    Use estas ações no n8n para automatizar cobranças
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <code className="text-primary font-mono text-sm">get_pending_clients</code>
                      <p className="text-muted-foreground text-sm mt-1">
                        Lista todos os clientes com parcelas pendentes ou atrasadas
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <code className="text-primary font-mono text-sm">generate_messages</code>
                      <p className="text-muted-foreground text-sm mt-1">
                        Gera mensagens de cobrança personalizadas para os clientes
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <code className="text-primary font-mono text-sm">log_sent</code>
                      <p className="text-muted-foreground text-sm mt-1">
                        Registra que as mensagens foram enviadas
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Example Payload */}
                  <div className="space-y-2">
                    <Label>Exemplo de Payload</Label>
                    <pre className="p-4 rounded-lg bg-secondary/50 text-xs font-mono overflow-x-auto">
{`// Headers necessários
{
  "Content-Type": "application/json",
  "apikey": "sua_anon_key",
  "Authorization": "Bearer sua_anon_key"
}

// 1. Buscar clientes pendentes
POST ${apiEndpoint}
{ "action": "get_pending_clients" }

// 2. Gerar mensagens
POST ${apiEndpoint}
{
  "action": "generate_messages",
  "client_ids": ["uuid1", "uuid2"],
  "tone": "amigavel"  // amigavel, formal, urgente
}

// 3. Registrar envios
POST ${apiEndpoint}
{ "action": "log_sent", "client_ids": ["uuid1"] }`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Setup Guide */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">🚀 Fluxo Rápido no n8n</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li><strong>Schedule Trigger</strong> → Configure horário (ex: 9h)</li>
                    <li><strong>HTTP Request</strong> → <code className="text-primary">get_pending_clients</code></li>
                    <li><strong>Limit</strong> → Máximo 20 clientes por execução</li>
                    <li><strong>HTTP Request</strong> → <code className="text-primary">generate_messages</code></li>
                    <li><strong>Split In Batches</strong> → Processar 1 por vez</li>
                    <li><strong>Evolution API Node</strong> → Enviar WhatsApp</li>
                    <li><strong>Wait</strong> → 3 minutos entre cada envio</li>
                  </ol>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      </motion.div>
    </MainLayout>
  );
};

export default Configuracoes;
