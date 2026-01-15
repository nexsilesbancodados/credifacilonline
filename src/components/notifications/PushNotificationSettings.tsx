import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { 
  Bell, 
  BellOff, 
  BellRing, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationSettings() {
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const {
    isSupported,
    permission,
    preferences,
    enableNotifications,
    disableNotifications,
    updatePreferences,
    showNotification,
    checkDueInstallments,
  } = usePushNotifications();

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const success = await enableNotifications();
      if (success) {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas sobre vencimentos e pagamentos.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações no navegador.",
          variant: "destructive",
        });
      }
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable = () => {
    disableNotifications();
    toast({
      title: "Notificações desativadas",
      description: "Você não receberá mais alertas push.",
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await showNotification("🔔 Teste de Notificação", {
        body: "As notificações estão funcionando corretamente!",
        tag: "test",
      });
      toast({
        title: "Notificação enviada!",
        description: "Verifique se a notificação apareceu.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCheckNow = async () => {
    await checkDueInstallments();
    toast({
      title: "Verificação concluída",
      description: "Vencimentos verificados. Notificações enviadas se necessário.",
    });
  };

  if (!isSupported) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta notificações push. 
              Tente usar Chrome, Firefox, Edge ou Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            Notificações Push do Navegador
          </CardTitle>
          <CardDescription>
            Receba alertas instantâneos sobre vencimentos e pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-3">
              {preferences.enabled && permission === 'granted' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : permission === 'denied' ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <Bell className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Status das Notificações</p>
                <p className="text-sm text-muted-foreground">
                  {permission === 'denied' 
                    ? 'Bloqueado pelo navegador'
                    : preferences.enabled && permission === 'granted'
                    ? 'Ativo - verificando a cada 30 min'
                    : 'Desativado'}
                </p>
              </div>
            </div>
            <Badge 
              variant={preferences.enabled && permission === 'granted' ? 'default' : 'secondary'}
              className={preferences.enabled && permission === 'granted' ? 'bg-green-500' : ''}
            >
              {preferences.enabled && permission === 'granted' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Permission denied warning */}
          {permission === 'denied' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você bloqueou as notificações. Para ativar, clique no ícone de cadeado 
                na barra de endereço do navegador e permita notificações.
              </AlertDescription>
            </Alert>
          )}

          {/* Enable/Disable button */}
          {permission !== 'denied' && (
            <div className="flex gap-3">
              {!preferences.enabled ? (
                <Button 
                  onClick={handleEnable} 
                  disabled={isEnabling}
                  className="flex-1"
                >
                  {isEnabling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Ativar Notificações
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDisable}
                    className="flex-1"
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    Desativar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTest}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCheckNow}
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Preferences (only show when enabled) */}
          {preferences.enabled && permission === 'granted' && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-semibold">Tipos de Alertas</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="font-medium text-sm">Vencimentos de Hoje</p>
                        <p className="text-xs text-muted-foreground">
                          Alerta sobre parcelas que vencem hoje
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.dueToday}
                      onCheckedChange={(checked) => updatePreferences({ dueToday: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Vencimentos de Amanhã</p>
                        <p className="text-xs text-muted-foreground">
                          Lembrete das parcelas que vencem amanhã
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.dueTomorrow}
                      onCheckedChange={(checked) => updatePreferences({ dueTomorrow: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <div>
                        <p className="font-medium text-sm">Parcelas em Atraso</p>
                        <p className="text-xs text-muted-foreground">
                          Alerta sobre parcelas não pagas
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.overdue}
                      onCheckedChange={(checked) => updatePreferences({ overdue: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Pagamentos Recebidos</p>
                        <p className="text-xs text-muted-foreground">
                          Notificação ao registrar pagamentos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.payments}
                      onCheckedChange={(checked) => updatePreferences({ payments: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  💡 As notificações são verificadas automaticamente a cada 30 minutos 
                  enquanto o app estiver aberto. Para verificar agora, clique no botão 
                  de sino acima.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
