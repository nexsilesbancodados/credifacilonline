import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Lock } from "lucide-react";

interface PermissionGateProps {
  children: ReactNode;
  permission: 
    | 'canViewClients'
    | 'canEditClients'
    | 'canDeleteClients'
    | 'canViewContracts'
    | 'canCreateContracts'
    | 'canEditContracts'
    | 'canDeleteContracts'
    | 'canViewPayments'
    | 'canProcessPayments'
    | 'canViewTreasury'
    | 'canManageTreasury'
    | 'canViewReports'
    | 'canExportData'
    | 'canViewSettings'
    | 'canManageSettings'
    | 'canViewAuditLog'
    | 'canManageUsers'
    | 'canUploadDocuments'
    | 'canDeleteDocuments';
  fallback?: ReactNode;
  showLocked?: boolean;
}

export function PermissionGate({ 
  children, 
  permission, 
  fallback = null,
  showLocked = false 
}: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    if (showLocked) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground opacity-50 cursor-not-allowed">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Sem permissão</span>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
