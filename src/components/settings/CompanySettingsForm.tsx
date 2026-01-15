import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Save, Loader2, Percent, Calculator } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/contexts/AuthContext";

export function CompanySettingsForm() {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    cnpj: "",
    default_fine_percentage: 2,
    default_daily_interest: 0.033,
    default_frequency: "mensal",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || profile?.company || "",
        cnpj: settings.cnpj || profile?.cnpj || "",
        default_fine_percentage: settings.default_fine_percentage,
        default_daily_interest: settings.default_daily_interest,
        default_frequency: settings.default_frequency,
      });
    }
  }, [settings, profile]);

  const handleSave = () => {
    updateSettings(formData);
  };

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
    >
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Configure as informações da sua empresa e valores padrão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Razão Social</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Configurações de Multa e Juros</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Defina os valores padrão para cálculo de multas e juros de atraso em todos os contratos
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fine_percentage" className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Multa por Atraso (%)
                </Label>
                <Input
                  id="fine_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.default_fine_percentage}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_fine_percentage: parseFloat(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Multa fixa aplicada no primeiro dia de atraso
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="daily_interest" className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Juros Diário (%)
                </Label>
                <Input
                  id="daily_interest"
                  type="number"
                  step="0.001"
                  min="0"
                  max="10"
                  value={formData.default_daily_interest}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_daily_interest: parseFloat(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  0.033% = ~1% ao mês (1/30)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Frequência Padrão</Label>
                <Select 
                  value={formData.default_frequency}
                  onValueChange={(value) => setFormData({ ...formData, default_frequency: value })}
                >
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

            {/* Preview calculation */}
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
              <p className="text-sm font-medium">Exemplo de cálculo:</p>
              <p className="text-sm text-muted-foreground">
                Para uma parcela de <span className="text-foreground font-medium">R$ 1.000,00</span> com{" "}
                <span className="text-foreground font-medium">10 dias</span> de atraso:
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Multa:</span>{" "}
                  <span className="text-destructive font-medium">
                    R$ {(1000 * formData.default_fine_percentage / 100).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Juros (10d):</span>{" "}
                  <span className="text-destructive font-medium">
                    R$ {(1000 * formData.default_daily_interest / 100 * 10).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="text-primary font-bold">
                    R$ {(1000 + (1000 * formData.default_fine_percentage / 100) + (1000 * formData.default_daily_interest / 100 * 10)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
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
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
