import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Smartphone,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  QrCode,
  LogOut,
  RotateCcw,
  Send,
  MessageSquare,
} from "lucide-react";

interface Instance {
  instanceName: string;
  instanceId?: string;
  status?: string;
  state?: string;
  owner?: string;
}

interface ConnectionState {
  state: string;
  instance?: string;
}

const QRCodeGenerator = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [connectionStates, setConnectionStates] = useState<Record<string, string>>({});
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const callEvolutionApi = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("evolution-api", {
      body: payload,
    });
    if (error) throw error;
    return data;
  }, []);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callEvolutionApi({ action: "list_instances" });
      const list = Array.isArray(data) ? data : data?.instances || [];
      setInstances(list.map((i: any) => ({
        instanceName: i.instance?.instanceName || i.instanceName || i.name,
        instanceId: i.instance?.instanceId || i.instanceId,
        status: i.instance?.status || i.status,
        owner: i.instance?.owner || i.owner,
      })));

      // Fetch connection states
      for (const inst of list) {
        const name = inst.instance?.instanceName || inst.instanceName || inst.name;
        if (name) {
          try {
            const state = await callEvolutionApi({ action: "get_instance", instanceName: name });
            setConnectionStates(prev => ({ ...prev, [name]: state?.instance?.state || state?.state || "unknown" }));
          } catch {
            setConnectionStates(prev => ({ ...prev, [name]: "unknown" }));
          }
        }
      }
    } catch (err: any) {
      toast.error("Erro ao buscar instâncias: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }, [callEvolutionApi]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const extractQrCode = (data: any): string | null => {
    if (data?.qrcode?.base64) return data.qrcode.base64;
    if (data?.base64) return data.base64;
    if (typeof data?.qrcode === "string") return data.qrcode;
    return null;
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Digite o nome da instância");
      return;
    }
    setCreating(true);
    try {
      const data = await callEvolutionApi({
        action: "create_instance",
        instanceName: newInstanceName.trim(),
      });

      

      const qr = extractQrCode(data);
      if (qr) {
        setQrCodes(prev => ({ ...prev, [newInstanceName.trim()]: qr }));
        toast.success("QR Code gerado! Escaneie com o WhatsApp.");
      } else {
        toast.success(`Instância "${newInstanceName}" criada! Clique em "Conectar" para gerar o QR Code.`);
      }

      setNewInstanceName("");
      await fetchInstances();
    } catch (err: any) {
      console.error("Create instance error:", err);
      toast.error("Erro ao criar instância: " + (err.message || "Erro desconhecido"));
    } finally {
      setCreating(false);
    }
  };

  const handleConnect = async (instanceName: string) => {
    try {
      const data = await callEvolutionApi({ action: "connect_instance", instanceName });
      console.log("Connect instance response:", JSON.stringify(data, null, 2));
      
      const qr = extractQrCode(data);
      if (qr) {
        setQrCodes(prev => ({ ...prev, [instanceName]: qr }));
        toast.success("QR Code gerado! Escaneie com o WhatsApp.");
      } else if (data?.instance?.state === "open" || data?.state === "open") {
        toast.success("Instância já está conectada!");
        setConnectionStates(prev => ({ ...prev, [instanceName]: "open" }));
      } else {
        console.warn("No QR code found in response:", data);
        toast.info("Nenhum QR Code retornado. Tente novamente em alguns segundos.");
      }
    } catch (err: any) {
      console.error("Connect error:", err);
      toast.error("Erro ao conectar: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleLogout = async (instanceName: string) => {
    try {
      await callEvolutionApi({ action: "logout_instance", instanceName });
      toast.success(`Instância "${instanceName}" desconectada.`);
      setConnectionStates(prev => ({ ...prev, [instanceName]: "close" }));
      setQrCodes(prev => { const n = { ...prev }; delete n[instanceName]; return n; });
    } catch (err: any) {
      toast.error("Erro ao desconectar: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleDelete = async (instanceName: string) => {
    if (!confirm(`Excluir a instância "${instanceName}"?`)) return;
    try {
      await callEvolutionApi({ action: "delete_instance", instanceName });
      toast.success(`Instância "${instanceName}" excluída.`);
      await fetchInstances();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleRestart = async (instanceName: string) => {
    try {
      await callEvolutionApi({ action: "restart_instance", instanceName });
      toast.success(`Instância "${instanceName}" reiniciada.`);
      setTimeout(fetchInstances, 2000);
    } catch (err: any) {
      toast.error("Erro ao reiniciar: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleSendTest = async () => {
    if (!selectedInstance || !testNumber.trim() || !testMessage.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSendingMessage(true);
    try {
      await callEvolutionApi({
        action: "send_text",
        instanceName: selectedInstance,
        number: testNumber.replace(/\D/g, ""),
        text: testMessage,
      });
      toast.success("Mensagem enviada com sucesso!");
      setTestMessage("");
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Erro desconhecido"));
    } finally {
      setSendingMessage(false);
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "open":
        return <Badge variant="default"><Wifi className="h-3 w-3 mr-1" /> Conectado</Badge>;
      case "close":
        return <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" /> Desconectado</Badge>;
      case "connecting":
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" /> Desconhecido</Badge>;
    }
  };

  const connectedInstances = instances.filter(i => connectionStates[i.instanceName] === "open");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-7 w-7 text-primary" />
            Gerenciar Instâncias WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie instâncias do WhatsApp via Evolution API.
          </p>
        </div>

        {/* Create Instance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nova Instância
            </CardTitle>
            <CardDescription>Crie uma nova instância para conectar ao WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Nome da instância (ex: atendimento-01)"
                value={newInstanceName}
                onChange={e => setNewInstanceName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateInstance()}
                className="flex-1"
              />
              <Button onClick={handleCreateInstance} disabled={creating}>
                {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instances List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Instâncias ({instances.length})</CardTitle>
              <CardDescription>Gerencie suas conexões WhatsApp</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma instância encontrada. Crie uma acima.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {instances.map((inst) => (
                  <div
                    key={inst.instanceName}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{inst.instanceName}</p>
                          {inst.instanceId && (
                            <p className="text-xs text-muted-foreground">ID: {inst.instanceId}</p>
                          )}
                        </div>
                      </div>
                      {getStateBadge(connectionStates[inst.instanceName] || "unknown")}
                    </div>

                    {/* QR Code */}
                    {qrCodes[inst.instanceName] && connectionStates[inst.instanceName] !== "open" && (
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <img
                          src={qrCodes[inst.instanceName]}
                          alt="QR Code WhatsApp"
                          className="w-64 h-64"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {connectionStates[inst.instanceName] !== "open" && (
                        <Button size="sm" onClick={() => handleConnect(inst.instanceName)}>
                          <QrCode className="h-4 w-4 mr-1" /> Conectar
                        </Button>
                      )}
                      {connectionStates[inst.instanceName] === "open" && (
                        <Button size="sm" variant="outline" onClick={() => handleLogout(inst.instanceName)}>
                          <LogOut className="h-4 w-4 mr-1" /> Desconectar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleRestart(inst.instanceName)}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reiniciar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(inst.instanceName)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                      {connectionStates[inst.instanceName] === "open" && (
                        <Button size="sm" variant="secondary" onClick={() => setSelectedInstance(inst.instanceName)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> Testar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Message */}
        {selectedInstance && connectedInstances.some(i => i.instanceName === selectedInstance) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" /> Enviar Mensagem de Teste
              </CardTitle>
              <CardDescription>Instância: {selectedInstance}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Número (com DDD e código do país)</Label>
                <Input
                  placeholder="5511999999999"
                  value={testNumber}
                  onChange={e => setTestNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Input
                  placeholder="Olá! Esta é uma mensagem de teste."
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendTest()}
                />
              </div>
              <Button onClick={handleSendTest} disabled={sendingMessage}>
                {sendingMessage ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default QRCodeGenerator;
