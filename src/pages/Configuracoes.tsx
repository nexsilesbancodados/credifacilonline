import { useState } from "react";
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
import {
  User,
  Building2,
  Bell,
  Webhook,
  Bot,
  Shield,
  Save,
  Clock,
} from "lucide-react";

const Configuracoes = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

  // N8N settings
  const [n8nSettings, setN8nSettings] = useState({
    webhookUrl: "",
    activeEvents: {
      newContract: true,
      payment: true,
      overdue: false,
      renegotiation: true,
    },
  });

  // AI Agent settings
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
          <TabsList className="bg-muted/50 p-1">
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
            <TabsTrigger value="n8n" className="gap-2">
              <Webhook className="w-4 h-4" />
              N8N
            </TabsTrigger>
            <TabsTrigger value="ai-agent" className="gap-2">
              <Bot className="w-4 h-4" />
              Agente IA
            </TabsTrigger>
          </TabsList>

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>
                    Configure as informações da sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Razão Social</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={profile.cnpj}
                        onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Configurações Padrão de Contratos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Taxa de Juros Padrão (%)</Label>
                        <Input type="number" defaultValue="10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Multa por Atraso (%)</Label>
                        <Input type="number" defaultValue="2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequência Padrão</Label>
                        <Select defaultValue="mensal">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => handleSave("empresa")}
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

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Notificações por Email</h3>
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

          {/* N8N Tab */}
          <TabsContent value="n8n">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    Integração N8N
                  </CardTitle>
                  <CardDescription>
                    Configure webhooks para automação com N8N
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL do Webhook</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://n8n.seu-dominio.com/webhook/..."
                      value={n8nSettings.webhookUrl}
                      onChange={(e) => setN8nSettings({ ...n8nSettings, webhookUrl: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Cole aqui a URL do webhook do seu fluxo N8N
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Eventos Ativos</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione quais eventos devem disparar o webhook
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Novo contrato</p>
                          <p className="text-sm text-muted-foreground">Quando um novo contrato é criado</p>
                        </div>
                        <Switch
                          checked={n8nSettings.activeEvents.newContract}
                          onCheckedChange={(checked) =>
                            setN8nSettings({
                              ...n8nSettings,
                              activeEvents: { ...n8nSettings.activeEvents, newContract: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Pagamento recebido</p>
                          <p className="text-sm text-muted-foreground">Quando um pagamento é registrado</p>
                        </div>
                        <Switch
                          checked={n8nSettings.activeEvents.payment}
                          onCheckedChange={(checked) =>
                            setN8nSettings({
                              ...n8nSettings,
                              activeEvents: { ...n8nSettings.activeEvents, payment: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Parcela atrasada</p>
                          <p className="text-sm text-muted-foreground">Quando uma parcela entra em atraso</p>
                        </div>
                        <Switch
                          checked={n8nSettings.activeEvents.overdue}
                          onCheckedChange={(checked) =>
                            setN8nSettings({
                              ...n8nSettings,
                              activeEvents: { ...n8nSettings.activeEvents, overdue: checked },
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Renegociação</p>
                          <p className="text-sm text-muted-foreground">Quando uma dívida é renegociada</p>
                        </div>
                        <Switch
                          checked={n8nSettings.activeEvents.renegotiation}
                          onCheckedChange={(checked) =>
                            setN8nSettings({
                              ...n8nSettings,
                              activeEvents: { ...n8nSettings.activeEvents, renegotiation: checked },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => handleSave("N8N")}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar configurações
                    </Button>
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
                      onClick={() => handleSave("Agente IA")}
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
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
