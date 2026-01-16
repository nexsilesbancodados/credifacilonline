import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCompanySettings, AIAgentTriggers } from "@/hooks/useCompanySettings";
import { Bot, Clock, CalendarDays, Save, Loader2 } from "lucide-react";

// Generate time options from 06:00 to 22:00 in 30-min intervals
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    options.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 22) {
      options.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const triggerDaysConfig = [
  { key: "day1", label: "1 dia", description: "após vencimento" },
  { key: "day3", label: "3 dias", description: "após vencimento" },
  { key: "day7", label: "7 dias", description: "após vencimento" },
  { key: "day15", label: "15 dias", description: "após vencimento" },
  { key: "day30", label: "30 dias", description: "após vencimento" },
];

export function AIAgentSettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();

  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [triggers, setTriggers] = useState<AIAgentTriggers>({
    day1: true,
    day3: true,
    day7: true,
    day15: false,
    day30: false,
  });

  // Sync with settings when loaded
  useEffect(() => {
    if (settings) {
      setIsActive(settings.ai_agent_active ?? false);
      setStartTime(settings.ai_agent_start_time ?? "09:00");
      setEndTime(settings.ai_agent_end_time ?? "18:00");
      if (settings.ai_agent_triggers) {
        setTriggers(settings.ai_agent_triggers);
      }
    }
  }, [settings]);

  const handleTriggerChange = (key: string, checked: boolean) => {
    setTriggers((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleSave = () => {
    updateSettings({
      ai_agent_active: isActive,
      ai_agent_start_time: startTime,
      ai_agent_end_time: endTime,
      ai_agent_triggers: triggers,
    });
  };

  const activeTriggerCount = Object.values(triggers).filter(Boolean).length;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <Card
        className={`border-2 ${
          isActive
            ? "border-success/30 bg-success/5"
            : "border-muted/30 bg-muted/5"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isActive ? "bg-success/20" : "bg-muted/20"
              }`}
            >
              <Bot className={`h-6 w-6 ${isActive ? "text-success" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Agente de Cobrança Automático</h3>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `Ativo das ${startTime} às ${endTime} • ${activeTriggerCount} gatilhos configurados`
                  : "Desativado - mensagens automáticas não serão enviadas"}
              </p>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Configurações do Agente IA
          </CardTitle>
          <CardDescription>
            Configure quando e como o agente envia mensagens de cobrança automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activation Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="agent-active" className="text-base font-medium">
                Ativar Agente Automático
              </Label>
              <p className="text-sm text-muted-foreground">
                Envia mensagens de cobrança automaticamente via WhatsApp
              </p>
            </div>
            <Switch
              id="agent-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Separator />

          {/* Time Window */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Janela de Disparo</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Defina o período do dia em que as mensagens podem ser enviadas
            </p>

            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Início</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time" className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="text-muted-foreground pt-6">até</span>

              <div className="space-y-2">
                <Label htmlFor="end-time">Fim</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time" className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="outline" className="ml-4">
                {startTime} - {endTime}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Trigger Days */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Dias de Disparo Após Vencimento</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione quantos dias após o vencimento as cobranças automáticas serão enviadas
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {triggerDaysConfig.map((day) => (
                <div
                  key={day.key}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all cursor-pointer ${
                    triggers[day.key as keyof AIAgentTriggers]
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() =>
                    handleTriggerChange(
                      day.key,
                      !triggers[day.key as keyof AIAgentTriggers]
                    )
                  }
                >
                  <Checkbox
                    id={day.key}
                    checked={triggers[day.key as keyof AIAgentTriggers] ?? false}
                    onCheckedChange={(checked) =>
                      handleTriggerChange(day.key, checked as boolean)
                    }
                  />
                  <div className="text-center">
                    <p className="font-semibold">{day.label}</p>
                    <p className="text-xs text-muted-foreground">{day.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
