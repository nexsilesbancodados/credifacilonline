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

const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    canViewClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canViewPayments: true,
    canProcessPayments: true,
    canViewTreasury: true,
    canManageTreasury: true,
    canViewReports: true,
    canExportData: true,
    canViewSettings: true,
    canManageSettings: true,
    canViewAuditLog: true,
    canManageUsers: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
  },
  operator: {
    canViewClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: false,
    canViewPayments: true,
    canProcessPayments: true,
    canViewTreasury: true,
    canManageTreasury: false,
    canViewReports: true,
    canExportData: true,
    canViewSettings: true,
    canManageSettings: false,
    canViewAuditLog: false,
    canManageUsers: false,
    canUploadDocuments: true,
    canDeleteDocuments: false,
  },
  viewer: {
    canViewClients: true,
    canEditClients: false,
    canDeleteClients: false,
    canViewContracts: true,
    canCreateContracts: false,
    canEditContracts: false,
    canDeleteContracts: false,
    canViewPayments: true,
    canProcessPayments: false,
    canViewTreasury: true,
    canManageTreasury: false,
    canViewReports: true,
    canExportData: false,
    canViewSettings: false,
    canManageSettings: false,
    canViewAuditLog: false,
    canManageUsers: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
  },
};

export function usePermissions() {
  const { profile } = useAuth();
  
  const role = (profile?.role as UserRole) || 'operator';
  
  // All permissions enabled for all users
  const permissions: Permissions = {
    canViewClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewContracts: true,
    canCreateContracts: true,
    canEditContracts: true,
    canDeleteContracts: true,
    canViewPayments: true,
    canProcessPayments: true,
    canViewTreasury: true,
    canManageTreasury: true,
    canViewReports: true,
    canExportData: true,
    canViewSettings: true,
    canManageSettings: true,
    canViewAuditLog: true,
    canManageUsers: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
  };

  const hasPermission = (_permission: keyof Permissions): boolean => {
    return true; // All permissions enabled
  };

  const isAdmin = true;
  const isOperator = role === 'operator';
  const isViewer = role === 'viewer';

  return {
    role,
    permissions,
    hasPermission,
    isAdmin,
    isOperator,
    isViewer,
  };
}
