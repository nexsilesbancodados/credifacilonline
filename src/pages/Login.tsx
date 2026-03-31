import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, TrendingUp, Shield, Zap, BarChart3, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MeteorShower } from "@/components/effects/MeteorShower";

const features = [
  { icon: Shield, label: "Segurança total", desc: "Criptografia de ponta a ponta em todos os dados" },
  { icon: Zap, label: "Cobrança inteligente", desc: "Automação via WhatsApp com IA avançada" },
  { icon: BarChart3, label: "Analytics em tempo real", desc: "Dashboard com métricas e previsões" },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "50k+", label: "Contratos" },
  { value: "R$2M+", label: "Gerenciados" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div className="min-h-screen flex relative overflow-hidden bg-[#060a14]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <MeteorShower count={30} />
        {/* Large ambient orbs */}
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-blue-600/[0.07] rounded-full blur-[150px]" />
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-indigo-600/[0.06] rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[180px]" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative animate-fade-in z-10">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/10">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">Credifacil</h1>
              <p className="text-[11px] text-blue-300/40 font-medium uppercase tracking-widest">Gestão de Crédito</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-10 max-w-lg">
          <div>
            <h2 className="font-display text-[3.2rem] font-extrabold text-white leading-[1.1] tracking-tight">
              Gestão de crédito{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">simplificada</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                      <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="rgb(129,140,248)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>
            <p className="mt-6 text-blue-100/40 text-lg leading-relaxed max-w-md">
              Controle total da sua carteira de crédito com cobranças automatizadas e inteligência artificial.
            </p>
          </div>

          <div className="space-y-2.5">
            {features.map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm px-5 py-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-400/10 group-hover:from-blue-500/25 group-hover:to-indigo-500/25 transition-all">
                  <feat.icon className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white/90 text-sm">{feat.label}</p>
                  <p className="text-xs text-blue-200/30 mt-0.5">{feat.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/0 group-hover:text-white/30 ml-auto shrink-0 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
            ))}
          </div>

          {/* Social proof stats */}
          <div className="flex items-center gap-8 pt-2">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-200/30 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <p className="text-[11px] text-blue-200/20">
            © 2025 Credifacil. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <div className="w-full max-w-[420px] relative animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 ring-1 ring-white/10 mb-3">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Credifacil</h1>
            <p className="text-xs text-blue-300/40 mt-0.5">Sistema de gestão de crédito</p>
          </div>

          {/* Desktop logo above form */}
          <div className="hidden lg:flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 ring-1 ring-white/10 mb-3">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-xl font-bold text-white tracking-tight">Credifacil</h1>
          </div>

          {/* Form Card */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-indigo-500/10 pointer-events-none" />
            <div className="absolute -inset-8 rounded-[40px] bg-blue-500/[0.03] blur-2xl pointer-events-none" />

            <div className="relative rounded-3xl border border-white/[0.08] bg-[#0c1222]/80 backdrop-blur-2xl shadow-2xl shadow-black/50 p-8 sm:p-9">
              <div className="text-center mb-8">
                <h2 className="font-display text-[1.65rem] font-bold text-white tracking-tight">Bem-vindo de volta</h2>
                <p className="text-sm text-blue-200/40 mt-1.5">
                  Entre com suas credenciais para acessar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-blue-100/60 ml-0.5">Email</Label>
                  <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-blue-500/20' : ''}`}>
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-400' : 'text-white/20'}`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-12 h-[52px] bg-white/[0.04] border-white/[0.07] rounded-2xl text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500/30 transition-all text-[15px]"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-0.5 mr-0.5">
                    <Label htmlFor="password" className="text-sm font-medium text-blue-100/60">Senha</Label>
                    <Link to="/forgot-password" className="text-xs text-blue-400/60 hover:text-blue-400 transition-colors font-medium">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className={`relative group rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-blue-500/20' : ''}`}>
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-400' : 'text-white/20'}`} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-[52px] bg-white/[0.04] border-white/[0.07] rounded-2xl text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500/30 transition-all text-[15px]"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full h-[52px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35 transition-all duration-300 text-[15px] relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <span className="flex items-center gap-2">
                        Entrar
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-7 text-center">
                <p className="text-sm text-blue-200/30">
                  Não tem uma conta?{" "}
                  <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Criar conta grátis
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mt-8">
            {["SSL Seguro", "LGPD", "Backup diário"].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-[11px] text-blue-200/20">
                <CheckCircle className="h-3 w-3" />
                {badge}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-blue-200/15 mt-5 lg:hidden">
            © 2025 Credifacil
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
