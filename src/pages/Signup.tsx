import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, Phone, TrendingUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MeteorShower } from "@/components/effects/MeteorShower";

const benefits = [
  "Controle total da carteira",
  "Cobrança automática via WhatsApp",
  "Relatórios e análises detalhadas",
  "Simulador de empréstimos",
];

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const passwordStrength = formData.password.length >= 8 ? "forte" : formData.password.length >= 6 ? "média" : "fraca";
  const strengthColor = passwordStrength === "forte" ? "bg-success" : passwordStrength === "média" ? "bg-warning" : "bg-destructive";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password, formData.name);
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Conta criada!", description: "Bem-vindo ao Credifacil." });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <MeteorShower count={15} />

      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <TrendingUp className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Credifacil</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
              Comece a gerenciar<br />
              seus <span className="text-gradient-gold">créditos</span><br />
              agora mesmo.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Crie sua conta e tenha acesso a todas as funcionalidades em poucos minutos.
            </p>
          </div>

          <div className="space-y-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-foreground text-sm">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © 2025 Credifacil. Todos os direitos reservados.
        </p>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <TrendingUp className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Credifacil</h1>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Criar nova conta</h2>
              <p className="text-sm text-muted-foreground mt-1">Preencha os dados para começar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" placeholder="Seu nome" className="pl-10 h-11 bg-background/50 rounded-xl"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" className="pl-10 h-11 bg-background/50 rounded-xl"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="(00) 00000-0000" className="pl-10 h-11 bg-background/50 rounded-xl"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-background/50 rounded-xl"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColor}`}
                        style={{ width: passwordStrength === "forte" ? "100%" : passwordStrength === "média" ? "60%" : "30%" }} />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">Senha {passwordStrength}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-background/50 rounded-xl"
                    value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button type="submit"
                className="w-full h-12 bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold rounded-xl shadow-gold"
                disabled={isLoading}>
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">Entrar</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;