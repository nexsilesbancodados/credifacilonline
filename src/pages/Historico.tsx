import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
import { useActivityHistory, useActivityStats, ActivityType } from "@/hooks/useActivityHistory";
import { cn } from "@/lib/utils";

const activityTypeConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
  client: { label: "Cliente", icon: User, color: "bg-blue-500/10 text-blue-500" },
  contract: { label: "Contrato", icon: FileText, color: "bg-green-500/10 text-green-500" },
  payment: { label: "Pagamento", icon: CreditCard, color: "bg-primary/10 text-primary" },
  renegotiation: { label: "Renegociação", icon: RefreshCw, color: "bg-purple-500/10 text-purple-500" },
  collection: { label: "Cobrança", icon: Phone, color: "bg-orange-500/10 text-orange-500" },
  system: { label: "Sistema", icon: Settings, color: "bg-muted text-muted-foreground" },
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

function ActivityRow({ activity }: { activity: any }) {
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

export default function Historico() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data: activities, isLoading: isLoadingActivities } = useActivityHistory(
    activityType,
    searchQuery,
    currentPage,
    itemsPerPage
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <History className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Histórico de Atividades</h1>
              <p className="text-sm text-muted-foreground">
                Auditoria completa de todas as ações realizadas
              </p>
            </div>
          </div>
        </motion.div>

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
              <StatCard
                title="Total de Atividades"
                value={stats?.total || 0}
                icon={Activity}
                description="Todas as ações registradas"
              />
              <StatCard
                title="Hoje"
                value={stats?.today || 0}
                icon={Clock}
                description="Atividades nas últimas 24h"
              />
              <StatCard
                title="Esta Semana"
                value={stats?.thisWeek || 0}
                icon={TrendingUp}
                description="Últimos 7 dias"
              />
              <StatCard
                title="Este Mês"
                value={stats?.thisMonth || 0}
                icon={Calendar}
                description="Desde o início do mês"
              />
            </>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
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
        </motion.div>

        {/* Activity Types Distribution */}
        {stats && Object.keys(stats.byType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
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
          </motion.div>
        )}

        {/* Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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

                  {/* Pagination */}
                  {activities && activities.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        Página {activities.currentPage} de {activities.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(activities.totalPages, p + 1))}
                          disabled={currentPage === activities.totalPages}
                          className="gap-1"
                        >
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
        </motion.div>
      </div>
    </MainLayout>
  );
}
