import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'operator' | 'viewer';

interface Permissions {
  canViewClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canViewContracts: boolean;
  canCreateContracts: boolean;
  canEditContracts: boolean;
  canDeleteContracts: boolean;
  canViewPayments: boolean;
  canProcessPayments: boolean;
  canViewTreasury: boolean;
  canManageTreasury: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canViewSettings: boolean;
  canManageSettings: boolean;
  canViewAuditLog: boolean;
  canManageUsers: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
}

export function usePermissions() {
  const { profile } = useAuth();
  const role = (profile?.role as UserRole) || 'operator';

  const hasPermission = (_permission: keyof Permissions): boolean => true;

  return {
    role,
    permissions: Object.fromEntries(
      Object.keys({} as Permissions).map(k => [k, true])
    ) as unknown as Permissions,
    hasPermission,
    isAdmin: true,
    isOperator: role === 'operator',
    isViewer: role === 'viewer',
  };
}
