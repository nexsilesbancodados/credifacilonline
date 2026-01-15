import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MessageSquare, 
  Save, 
  Loader2, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Phone,
  Key,
  Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WhatsAppSettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  const [formData, setFormData] = useState({
    whatsapp_api_token: "",
    whatsapp_phone_number_id: "",
    whatsapp_display_phone: "",
  });

  // Update form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        whatsapp_api_token: settings.whatsapp_api_token || "",
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id || "",
        whatsapp_display_phone: settings.whatsapp_display_phone || "",
      });
    }
  });

  // Sync form with settings when they change
  if (settings && !formData.whatsapp_api_token && settings.whatsapp_api_token) {
    setFormData({
      whatsapp_api_token: settings.whatsapp_api_token || "",
      whatsapp_phone_number_id: settings.whatsapp_phone_number_id || "",
      whatsapp_display_phone: settings.whatsapp_display_phone || "",
    });
  }

  const handleSave = () => {
    updateSettings({
      whatsapp_api_token: formData.whatsapp_api_token || null,
      whatsapp_phone_number_id: formData.whatsapp_phone_number_id || null,
      whatsapp_display_phone: formData.whatsapp_display_phone || null,
    });
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      toast({
        title: "Número não informado",
        description: "Digite um número para enviar a mensagem de teste.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.whatsapp_api_token || !formData.whatsapp_phone_number_id) {
      toast({
        title: "Configurações incompletas",
        description: "Preencha o Token e o Phone Number ID antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: {
          messages: [
            {
              to: testPhone,
              message: "🎉 Teste de conexão WhatsApp realizado com sucesso! Sua integração está funcionando corretamente.",
            },
          ],
          user_id: user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Teste enviado!",
          description: "A mensagem de teste foi enviada com sucesso.",
        });
      } else {
        toast({
          title: "Erro no envio",
          description: data?.errors?.[0]?.error || "Não foi possível enviar a mensagem de teste.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar",
        description: error.message || "Não foi possível testar a conexão.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = settings?.whatsapp_api_token && settings?.whatsapp_phone_number_id;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Status Card */}
      <Card className={`border-2 ${isConfigured ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {isConfigured ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-500" />
            )}
            <div>
              <h3 className="font-semibold">
                {isConfigured ? "WhatsApp Configurado" : "WhatsApp Não Configurado"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isConfigured 
                  ? `Número: ${settings?.whatsapp_display_phone || "Não informado"}`
                  : "Configure suas credenciais do WhatsApp Business API abaixo"}
              </p>
            </div>
            <Badge variant={isConfigured ? "default" : "secondary"} className="ml-auto">
              {isConfigured ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Configurações do WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Configure suas credenciais da Meta WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_api_token" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Access Token
              </Label>
              <Input
                id="whatsapp_api_token"
                type="password"
                value={formData.whatsapp_api_token}
                onChange={(e) => setFormData({ ...formData, whatsapp_api_token: e.target.value })}
                placeholder="EAAG..."
              />
              <p className="text-xs text-muted-foreground">
                Token de acesso permanente do WhatsApp Business API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_phone_number_id" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number ID
              </Label>
              <Input
                id="whatsapp_phone_number_id"
                value={formData.whatsapp_phone_number_id}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                placeholder="123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                ID do número de telefone registrado no WhatsApp Business
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_display_phone">Número para Exibição</Label>
              <Input
                id="whatsapp_display_phone"
                value={formData.whatsapp_display_phone}
                onChange={(e) => setFormData({ ...formData, whatsapp_display_phone: e.target.value })}
                placeholder="+55 11 99999-9999"
              />
              <p className="text-xs text-muted-foreground">
                Número para referência visual (não afeta o envio)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Credenciais
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Testar Conexão
          </CardTitle>
          <CardDescription>
            Envie uma mensagem de teste para verificar se as credenciais estão funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Número para teste (ex: 11999999999)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !isConfigured}
              variant="outline"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </div>
          {!isConfigured && (
            <p className="text-sm text-amber-500">
              Salve as credenciais antes de testar a conexão
            </p>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Como obter suas credenciais
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta for Developers</a></li>
              <li>Crie ou acesse seu App do WhatsApp Business</li>
              <li>Vá em WhatsApp → API Setup</li>
              <li>Copie o <strong>Access Token</strong> (gere um token permanente)</li>
              <li>Copie o <strong>Phone Number ID</strong></li>
              <li>Cole as credenciais nos campos acima</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}