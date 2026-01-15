import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Phone,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  History,
  Sun,
  Moon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { ExcelImport } from "@/components/imports/ExcelImport";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: FileText, label: "Contratos", path: "/contratos" },
  { icon: Phone, label: "Mesa de Cobrança", path: "/cobranca" },
  { icon: Wallet, label: "Tesouraria", path: "/tesouraria" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
  { icon: History, label: "Histórico", path: "/historico" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  // Get user initials from profile name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{
        background: "linear-gradient(180deg, hsl(38, 22%, 7%) 0%, hsl(38, 22%, 5%) 100%)",
      }}
    >
      {/* Border gradient right */}
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
      
      {/* Logo section */}
      <div className="flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-md -z-10" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="font-display text-lg font-bold text-gradient-gold">
                CreditWise
              </h1>
              <p className="text-xs text-muted-foreground">Elite</p>
            </motion.div>
          )}
        </Link>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.li
                key={item.path}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "text-primary",
                    "group-hover:scale-110"
                  )} />
                  {!isCollapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Importar Excel"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User Section */}
        <div className={cn(
          "rounded-xl bg-secondary/30 p-3 backdrop-blur-sm",
          isCollapsed && "flex items-center justify-center"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold">
                {getInitials(profile?.name || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role || "Operador"}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button 
                onClick={handleLogout}
                className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold hover:opacity-80 transition-opacity"
                title="Sair"
              >
                {getInitials(profile?.name || "")}
              </button>
            </div>
          )}
        </div>
      </div>

      <ExcelImport open={showImport} onOpenChange={setShowImport} />
    </motion.aside>
  );
}
