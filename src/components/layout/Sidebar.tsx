import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Wallet, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Sparkles, History, Sun, Moon,
  Upload, Calculator, QrCode, Bot, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { ExcelImport } from "@/components/imports/ExcelImport";
import { usePermissions } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: null },
      { icon: Calculator, label: "Simulador", path: "/simulador", permission: null },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: Users, label: "Clientes", path: "/clientes", permission: "canViewClients" as const },
      { icon: FileText, label: "Contratos", path: "/contratos", permission: "canViewContracts" as const },
      { icon: Phone, label: "Mesa de Cobrança", path: "/cobranca", permission: "canViewContracts" as const },
      { icon: Users, label: "Cobradores", path: "/cobradores", permission: "canViewClients" as const },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { icon: Wallet, label: "Tesouraria", path: "/tesouraria", permission: "canViewTreasury" as const },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { icon: BarChart3, label: "Análises", path: "/analises", permission: "canViewReports" as const },
      { icon: History, label: "Histórico", path: "/historico", permission: null },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { icon: QrCode, label: "WhatsApp", path: "/qrcode", permission: null },
      { icon: Bot, label: "Agente IA", path: "/agente-ia", permission: null },
      { icon: Settings, label: "Configurações", path: "/configuracoes", permission: "canViewSettings" as const },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { hasPermission } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { data: badges } = useSidebarBadges();

  const overdueCount = badges?.overdueCount || 0;
  const activeClientsCount = badges?.activeClientsCount || 0;

  // Badge map: path -> count (only show when > 0)
  const badgeCounts: Record<string, number> = {
    "/contratos": overdueCount,
    "/clientes": activeClientsCount,
  };

  // Badge style map: path -> variant
  const badgeStyles: Record<string, string> = {
    "/contratos": "bg-destructive text-destructive-foreground",
    "/clientes": "bg-primary/20 text-primary",
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0].charAt(0).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const SidebarLink = ({ item, isActive }: { item: typeof menuGroups[0]["items"][0]; isActive: boolean }) => {
    const Icon = item.icon;
    const badge = badgeCounts[item.path] || 0;
    const badgeStyle = badgeStyles[item.path] || "bg-destructive text-destructive-foreground";
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors duration-150",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {!isCollapsed && (
          <>
            <span className="text-sm whitespace-nowrap flex-1">{item.label}</span>
            {badge > 0 && (
              <span className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                badgeStyle
              )}>
                {badge}
              </span>
            )}
          </>
        )}
        {isCollapsed && badge > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold",
            badgeStyle
          )}>
            {badge}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-3 shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <h1 className="font-display text-lg font-bold text-gradient-gold">Credifacil</h1>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => item.permission === null || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-3">
              {!isCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="mx-auto mb-1 h-px w-6 bg-border/50" />}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <SidebarLink item={item} isActive={location.pathname === item.path} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 p-3 space-y-2 border-t border-border/30">
        <div className={cn("flex gap-1.5", isCollapsed && "flex-col items-center")}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={isCollapsed ? "right" : "top"} sideOffset={8}>
              {theme === "dark" ? "Tema claro" : "Tema escuro"}
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={() => setShowImport(true)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Upload className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={isCollapsed ? "right" : "top"} sideOffset={8}>Importar Excel</TooltipContent>
          </Tooltip>
        </div>

        <div className={cn("rounded-xl bg-secondary/30 p-2.5", isCollapsed && "flex items-center justify-center")}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                {getInitials(profile?.name || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile?.name || "Usuário"}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{profile?.role || "Operador"}</p>
              </div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Sair</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-sm hover:opacity-80 transition-opacity">
                  {getInitials(profile?.name || "")}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <p className="font-medium">{profile?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">Clique para sair</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <ExcelImport open={showImport} onOpenChange={setShowImport} />
    </aside>
  );
}
