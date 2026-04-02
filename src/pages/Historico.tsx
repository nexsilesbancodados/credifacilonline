import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  Search,
  Filter,
  User,
  FileText,
  CreditCard,
  RefreshCw,
  Phone,
  Settings,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  X,
  Shield,
  Download,
  DollarSign,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivityHistory, useActivityStats, ActivityType, DateRange } from "@/hooks/useActivityHistory";
import { cn } from "@/lib/utils";

const activityTypeConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
  client: { label: "Cliente", icon: User, color: "bg-blue-500/10 text-blue-500" },
  contract: { label: "Contrato", icon: FileText, color: "bg-green-500/10 text-green-500" },
  payment: { label: "Pagamento", icon: CreditCard, color: "bg-primary/10 text-primary" },
  renegotiation: { label: "Renegociação", icon: RefreshCw, color: "bg-purple-500/10 text-purple-500" },
  collection: { label: "Cobrança", icon: Phone, color: "bg-orange-500/10 text-orange-500" },
  system: { label: "Sistema", icon: Settings, color: "bg-muted text-muted-foreground" },
};

const typeIcons: Record<string, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  payment: <DollarSign className="h-4 w-4" />,
  renegotiation: <RefreshCw className="h-4 w-4" />,
  collection: <MessageCircle className="h-4 w-4" />,
  system: <Shield className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  client: "text-blue-500 bg-blue-500/10",
  contract: "text-primary bg-primary/10",
  payment: "text-success bg-success/10",
  renegotiation: "text-warning bg-warning/10",
  collection: "text-purple-500 bg-purple-500/10",
  system: "text-muted-foreground bg-secondary",
};

const typeLabels: Record<string, string> = {
  all: "Todas",
  client: "Clientes",
  contract: "Contratos",
  payment: "Pagamentos",
  renegotiation: "Renegociações",
  collection: "Cobranças",
  system: "Sistema",
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: typeof Activity;
  description: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground/70">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ activity }: { activity: { type: string; description: string; created_at: string; client_id: string | null; contract_id: string | null; metadata: Record<string, unknown> | null; client_name?: string } }) {
  const config = activityTypeConfig[activity.type] || activityTypeConfig.system;
  const Icon = config.icon;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell className="w-[180px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {format(new Date(activity.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/70 mt-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs">
            {format(new Date(activity.created_at), "HH:mm:ss", { locale: ptBR })}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-[120px]">
        <Badge variant="secondary" className={cn("gap-1", config.color)}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[400px]">
        <p className="text-sm font-medium text-foreground truncate">
          {activity.description}
        </p>
        {activity.client_name && (
          <p className="text-xs text-muted-foreground mt-1">
            Cliente: {activity.client_name}
          </p>
        )}
      </TableCell>
      <TableCell className="text-right">
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <Badge variant="outline" className="text-xs">
            +{Object.keys(activity.metadata).length} detalhes
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

// ========== Histórico Tab ==========
function HistoricoTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const itemsPerPage = 15;

  const { data: activities, isLoading: isLoadingActivities } = useActivityHistory(
    activityType,
    searchQuery,
    currentPage,
    itemsPerPage,
    dateRange
  );
  const { data: stats, isLoading: isLoadingStats } = useActivityStats();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setActivityType(value as ActivityType);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard title="Total de Atividades" value={stats?.total || 0} icon={Activity} description="Todas as ações registradas" />
            <StatCard title="Hoje" value={stats?.today || 0} icon={Clock} description="Atividades nas últimas 24h" />
            <StatCard title="Esta Semana" value={stats?.thisWeek || 0} icon={TrendingUp} description="Últimos 7 dias" />
            <StatCard title="Este Mês" value={stats?.thisMonth || 0} icon={Calendar} description="Desde o início do mês" />
          </>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar atividades..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
          <Select value={activityType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card/50 border-border/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="contract">Contratos</SelectItem>
              <SelectItem value="payment">Pagamentos</SelectItem>
              <SelectItem value="renegotiation">Renegociações</SelectItem>
              <SelectItem value="collection">Cobranças</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left font-normal bg-card/50 border-border/50", !dateRange.from && "text-muted-foreground")}>
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={dateRange.from} onSelect={(date) => handleDateRangeChange({ ...dateRange, from: date })} locale={ptBR} initialFocus />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left font-normal bg-card/50 border-border/50", !dateRange.to && "text-muted-foreground")}>
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={dateRange.to} onSelect={(date) => handleDateRangeChange({ ...dateRange, to: date })} locale={ptBR} disabled={(date) => dateRange.from ? date < dateRange.from : false} initialFocus />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-10 w-10 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="gap-1.5 py-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Período: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "..."}{" - "}{dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "..."}
            </Badge>
          )}
        </div>
      </div>

      {/* Activity Types Distribution */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => {
            const config = activityTypeConfig[type] || activityTypeConfig.system;
            const Icon = config.icon;
            return (
              <Badge
                key={type}
                variant="secondary"
                className={cn("gap-1.5 py-1.5 px-3 cursor-pointer transition-all", config.color,
                  activityType === type && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onClick={() => setActivityType(type as ActivityType)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Activity Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Registro de Atividades
            {activities && (
              <Badge variant="secondary" className="ml-2">
                {activities.totalCount} registros
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingActivities ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activities?.activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
              <p className="text-sm">As ações realizadas no sistema serão registradas aqui</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities?.activities.map((activity) => (
                    <ActivityRow key={activity.id} activity={activity} />
                  ))}
                </TableBody>
              </Table>
              {activities && activities.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
                  <p className="text-sm text-muted-foreground">Página {activities.currentPage} de {activities.totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(activities.totalPages, p + 1))} disabled={currentPage === activities.totalPages} className="gap-1">
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========== Auditoria Tab ==========
function AuditoriaTab() {
  const [filter, setFilter] = useState<ActivityType>("all");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const { data, isLoading } = useActivityHistory(filter, "", page, 20, dateRange);

  const handleExport = () => {
    if (!data?.activities) return;
    const csvContent = [
      ["Data", "Tipo", "Descrição", "Cliente"].join(","),
      ...data.activities.map((a) =>
        [
          format(parseISO(a.created_at), "dd/MM/yyyy HH:mm"),
          typeLabels[a.type] || a.type,
          `"${a.description}"`,
          a.client_name || "-",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(typeLabels) as ActivityType[]).map((type) => (
              <button
                key={type}
                onClick={() => { setFilter(type); setPage(1); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  filter === type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                {dateRange.from
                  ? dateRange.to
                    ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                    : format(dateRange.from, "dd/MM/yyyy")
                  : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => { setDateRange({ from: range?.from, to: range?.to }); setPage(1); }}
                numberOfMonths={2}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-3 border-t">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                    Limpar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Activity List */}
      <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data?.activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum registro encontrado</p>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data?.activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", typeColors[activity.type] || typeColors.system)}>
                  {typeIcons[activity.type] || typeIcons.system}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{format(parseISO(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    {activity.client_name && (<><span>•</span><span>Cliente: {activity.client_name}</span></>)}
                    <span>•</span>
                    <span className="capitalize">{typeLabels[activity.type] || activity.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/20">
            <p className="text-sm text-muted-foreground">Página {data.currentPage} de {data.totalPages} ({data.totalCount} registros)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Main Page ==========
export default function Historico() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <History className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Histórico e Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Registro completo de atividades e trilha de auditoria
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="historico">
          <TabsList className="bg-secondary/50 p-1 h-auto">
            <TabsTrigger value="historico" className="gap-2 data-[state=active]:shadow-md">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2 data-[state=active]:shadow-md">
              <Shield className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="mt-6">
            <HistoricoTab />
          </TabsContent>

          <TabsContent value="auditoria" className="mt-6">
            <AuditoriaTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
