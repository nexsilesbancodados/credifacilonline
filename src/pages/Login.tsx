import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, TrendingUp, Shield, Zap, BarChart3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MeteorShower } from "@/components/effects/MeteorShower";

const features = [
  { icon: Shield, label: "Segurança total", desc: "Dados criptografados end-to-end" },
  { icon: Zap, label: "Cobrança automática", desc: "WhatsApp integrado com IA" },
  { icon: BarChart3, label: "Análises em tempo real", desc: "Dashboard completo e inteligente" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Login realizado!", description: "Bem-vindo ao Credifacil." });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0a0e1a]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <MeteorShower count={25} />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative animate-fade-in z-10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Credifacil</h1>
          </div>
          <p className="text-blue-200/60 mt-1">Sistema de gestão de crédito</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-5xl font-bold text-white leading-tight">
              Gerencie seus<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-300 bg-clip-text text-transparent">empréstimos</span> com<br />
              facilidade.
            </h2>
            <p className="mt-5 text-blue-200/50 max-w-md text-lg leading-relaxed">
              Controle completo da sua carteira de crédito, cobranças automatizadas e análises inteligentes.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feat, i) => (
              <div
                key={feat.label}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 transition-all hover:bg-white/[0.06] hover:border-white/[0.1]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/10">
                  <feat.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{feat.label}</p>
                  <p className="text-xs text-blue-200/40">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-200/30">
          © 2025 Credifacil. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Credifacil</h1>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/40 p-8">
            {/* Glow effect behind the card */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-blue-500/10 via-transparent to-indigo-500/5 pointer-events-none -z-10" />

            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-white">Bem-vindo de volta</h2>
              <p className="text-sm text-blue-200/50 mt-2">
                Entre com suas credenciais para acessar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-blue-100/70">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-blue-100/70">Senha</Label>
                  <Link to="/forgot-password" className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-11 pr-11 h-12 bg-white/[0.04] border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-200/40">
                Não tem uma conta?{" "}
                <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Criar conta grátis
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-blue-200/30 mt-6 lg:hidden">
            © 2025 Credifacil. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
