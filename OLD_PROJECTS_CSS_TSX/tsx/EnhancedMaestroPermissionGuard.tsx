// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/guards/EnhancedMaestroPermissionGuard.tsx
// Enhanced Data Maestro Permission Guard
// Granular role-based access control with super_admin workflows and approval systems

import { AlertTriangle, CheckCircle, Crown, Lock, Shield, Users } from 'lucide-react';
import React from 'react';
import { useRouter, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/common/auth/hooks/useAuth';
import { useUser } from '@/user/features/User/hooks/useUser/useUser';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type MaestroRole = 'super_admin' | 'admin' | 'editor' | 'viewer';
export type MaestroOperation =
  | 'view_dashboard'
  | 'create_items'
  | 'edit_items'
  | 'delete_items'
  | 'import_data'
  | 'manage_schema'
  | 'bulk_operations'
  | 'system_settings'
  | 'approve_imports'
  | 'rollback_operations'
  | 'super_admin_controls'
  | 'audit_logs'
  | 'user_management'
  | 'critical_operations'
  | 'data_export'
  | 'schema_evolution'
  | 'approval_workflows'
  | 'security_settings'
  | 'system_maintenance'
  | 'emergency_access';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'not_required';

interface OperationApproval {
  operation: MaestroOperation;
  requester: string;
  timestamp: Date;
  status: ApprovalStatus;
  approver?: string;
  reason?: string;
}

const ENHANCED_PERMISSION_MATRIX: Record<MaestroRole, MaestroOperation[]> = {
  super_admin: [
    // Full system access
    'view_dashboard',
    'create_items',
    'edit_items',
    'delete_items',
    'import_data',
    'manage_schema',
    'bulk_operations',
    'system_settings',
    'approve_imports',
    'rollback_operations',
    'super_admin_controls',
    'audit_logs',
    'user_management',
    'critical_operations',
    'data_export',
    'schema_evolution',
    'approval_workflows',
    'security_settings',
    'system_maintenance',
    'emergency_access',
  ],
  admin: [
    // Standard admin operations
    'view_dashboard',
    'create_items',
    'edit_items',
    'delete_items',
    'import_data',
    'manage_schema',
    'bulk_operations',
    'approve_imports',
    'data_export',
    'audit_logs',
  ],
  editor: [
    // Content management
    'view_dashboard',
    'create_items',
    'edit_items',
    'import_data',
  ],
  viewer: [
    // Read-only access
    'view_dashboard',
  ],
};

// Operations that require super_admin approval even for admins
const SUPER_ADMIN_APPROVAL_REQUIRED: MaestroOperation[] = [
  'critical_operations',
  'schema_evolution',
  'system_maintenance',
  'security_settings',
  'emergency_access',
];

interface EnhancedMaestroPermissionGuardProps {
  children: React.ReactNode;
  requiredOperation: MaestroOperation;
  userRole?: MaestroRole;
  requiresApproval?: boolean;
  fallbackComponent?: React.ReactNode;
  showToast?: boolean;
  approvalCallback?: (operation: MaestroOperation) => void;
}

// Map database user roles to Maestro roles
const mapDatabaseRoleToMaestroRole = (dbRole: string | undefined): MaestroRole => {
  console.log('Enhanced Guard - Mapping database role to maestro role:', dbRole);

  switch (dbRole) {
    case 'super_admin':
      return 'super_admin';
    case 'admin':
      return 'admin';
    case 'maker':
      return 'editor';
    case 'subscriber':
    default:
      return 'viewer';
  }
};

// Get current user role from actual user data
const getCurrentUserRole = (): MaestroRole => {
  const { user } = useAuth();
  const { profile } = useUser();

  console.log(
    'Enhanced Guard - Getting current user role - User:',
    user?.id,
    'Profile:',
    profile?.role,
  );

  // Use profile role if available (most reliable)
  if (profile?.role) {
    const maestroRole = mapDatabaseRoleToMaestroRole(profile.role);
    console.log('Enhanced Guard - Mapped profile role:', profile.role, '→', maestroRole);
    return maestroRole;
  }

  // Fallback to user metadata role
  if (user?.user_metadata?.role) {
    const maestroRole = mapDatabaseRoleToMaestroRole(user.user_metadata.role);
    console.log(
      'Enhanced Guard - Mapped user metadata role:',
      user.user_metadata.role,
      '→',
      maestroRole,
    );
    return maestroRole;
  }

  // Fallback to app metadata role
  if (user?.app_metadata?.role) {
    const maestroRole = mapDatabaseRoleToMaestroRole(user.app_metadata.role);
    console.log(
      'Enhanced Guard - Mapped app metadata role:',
      user.app_metadata.role,
      '→',
      maestroRole,
    );
    return maestroRole;
  }

  console.log('Enhanced Guard - No role found, defaulting to viewer');
  return 'viewer';
};

const getCurrentUserId = (): string => {
  const { user } = useAuth();
  return user?.id || 'anonymous';
};

const hasDirectPermission = (userRole: MaestroRole, operation: MaestroOperation): boolean => {
  const hasAccess = ENHANCED_PERMISSION_MATRIX[userRole].includes(operation);
  console.log('Enhanced Guard - Permission check:', userRole, operation, '→', hasAccess);
  return hasAccess;
};

const requiresSuperAdminApproval = (
  userRole: MaestroRole,
  operation: MaestroOperation,
): boolean => {
  return userRole !== 'super_admin' && SUPER_ADMIN_APPROVAL_REQUIRED.includes(operation);
};

// Mock approval system (replace with real backend)
const getApprovalStatus = (operation: MaestroOperation, userId: string): ApprovalStatus => {
  const key = `approval_${operation}_${userId}`;
  return (localStorage.getItem(key) as ApprovalStatus) || 'not_required';
};

const requestApproval = (operation: MaestroOperation, userId: string): void => {
  const key = `approval_${operation}_${userId}`;
  localStorage.setItem(key, 'pending');
  toast.info('Approval Pending', {
    description: `Your request for ${operation.replace('_', ' ')} is awaiting super admin approval`,
  });
};

export const EnhancedMaestroPermissionGuard: React.FC<EnhancedMaestroPermissionGuardProps> = ({
  children,
  requiredOperation,
  userRole,
  requiresApproval = false,
  fallbackComponent,
  showToast = true,
  approvalCallback,
}) => {
  const router = useRouter();
  const currentRole = userRole || getCurrentUserRole();
  const userId = getCurrentUserId();
  const hasAccess = hasDirectPermission(currentRole, requiredOperation);
  const needsApproval =
    requiresApproval || requiresSuperAdminApproval(currentRole, requiredOperation);
  const approvalStatus = needsApproval
    ? getApprovalStatus(requiredOperation, userId)
    : 'not_required';

  console.log('EnhancedMaestroPermissionGuard:', {
    requiredOperation,
    currentRole,
    hasAccess,
    needsApproval,
    approvalStatus,
    userRole: userRole || 'auto-detected',
  });

  // Handle approval workflow
  const handleRequestApproval = () => {
    requestApproval(requiredOperation, userId);
    if (approvalCallback) {
      approvalCallback(requiredOperation);
    }
  };

  React.useEffect(() => {
    if (!hasAccess && showToast) {
      if (needsApproval && approvalStatus === 'pending') {
        toast.info('Approval Pending', {
          description: `Your request for ${requiredOperation.replace('_', ' ')} is awaiting super admin approval`,
        });
      } else if (!hasAccess) {
        toast.warning('Permission Denied', {
          description: `You need ${requiredOperation.replace('_', ' ')} permission to access this feature`,
        });
      }
    }
  }, [hasAccess, requiredOperation, showToast, needsApproval, approvalStatus]);

  // Grant access if user has direct permission or approved access
  if (hasAccess || approvalStatus === 'approved') {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Handle approval workflow UI
  if (needsApproval && approvalStatus === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card border-amber-500/30 max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <CardTitle className="text-amber-400 font-orbitron">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-300 mb-6 font-rajdhani">
              Your request for{' '}
              <span className="text-neon-cyan font-semibold">
                {requiredOperation.replace('_', ' ')}
              </span>{' '}
              is awaiting super admin approval.
            </p>
            <div className="space-y-3">
              <div className="text-sm text-gray-400">
                Status:{' '}
                <span className="text-amber-400 font-semibold animate-pulse">Pending Review</span>
              </div>
              <Button
                onClick={() => router.navigate({ to: '/admin/maestro' })}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-orbitron"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle denied approval
  if (needsApproval && approvalStatus === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card border-red-500/30 max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-400 font-orbitron">Request Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-300 mb-6 font-rajdhani">
              Your request for{' '}
              <span className="text-neon-cyan font-semibold">
                {requiredOperation.replace('_', ' ')}
              </span>{' '}
              has been denied.
            </p>
            <Button
              onClick={() => router.navigate({ to: '/admin/support' })}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-orbitron"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default access denied UI with approval option
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="glass-card border-red-500/30 max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-red-400 font-orbitron">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-rajdhani">Insufficient Permissions</span>
          </div>
          <p className="text-gray-300 mb-6 font-rajdhani">
            You need{' '}
            <span className="text-neon-cyan font-semibold">
              {requiredOperation.replace('_', ' ')}
            </span>{' '}
            permission to access this feature.
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-400">
              Your role: <span className="text-neon-purple font-semibold">{currentRole}</span>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.navigate({ to: '/admin/maestro' })}
                variant="outline"
                className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-orbitron"
              >
                <Shield className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              {needsApproval ? (
                <Button
                  onClick={handleRequestApproval}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-orbitron"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Request Approval
                </Button>
              ) : (
                <Button
                  onClick={() => router.navigate({ to: '/admin/support' })}
                  className="bg-gradient-to-r from-neon-purple to-neon-pink text-black font-orbitron"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Request Access
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced permissions hook with approval workflow support
export const useEnhancedMaestroPermissions = (userRole?: MaestroRole) => {
  const currentRole = userRole || getCurrentUserRole();
  const userId = getCurrentUserId();

  return {
    role: currentRole,
    userId,
    can: (operation: MaestroOperation) => hasDirectPermission(currentRole, operation),
    canWithApproval: (operation: MaestroOperation) => {
      const hasAccess = hasDirectPermission(currentRole, operation);
      const needsApproval = requiresSuperAdminApproval(currentRole, operation);
      const approvalStatus = needsApproval ? getApprovalStatus(operation, userId) : 'not_required';
      return hasAccess || approvalStatus === 'approved';
    },
    needsApproval: (operation: MaestroOperation) =>
      requiresSuperAdminApproval(currentRole, operation),
    getApprovalStatus: (operation: MaestroOperation) => getApprovalStatus(operation, userId),
    requestApproval: (operation: MaestroOperation) => requestApproval(operation, userId),
    isSuperAdmin: currentRole === 'super_admin',
    isAdmin: currentRole === 'admin' || currentRole === 'super_admin',
    isEditor: ['editor', 'admin', 'super_admin'].includes(currentRole),
    permissions: ENHANCED_PERMISSION_MATRIX[currentRole],
    approvalRequired: SUPER_ADMIN_APPROVAL_REQUIRED,
  };
};

// Role management utilities for super admins
export const useRoleManagement = () => {
  const permissions = useEnhancedMaestroPermissions();

  if (!permissions.isSuperAdmin) {
    throw new Error('Role management requires super_admin privileges');
  }

  return {
    // Mock functions - replace with real backend calls
    approveRequest: (operation: MaestroOperation, userId: string) => {
      const key = `approval_${operation}_${userId}`;
      localStorage.setItem(key, 'approved');
      toast.success('Approval Granted', {
        description: `Request for ${operation.replace('_', ' ')} is approved.`,
      });
    },

    denyRequest: (operation: MaestroOperation, userId: string, reason?: string) => {
      const key = `approval_${operation}_${userId}`;
      localStorage.setItem(key, 'denied');
      toast.error('Approval Denied', {
        description: `Request for ${operation.replace('_', ' ')} is denied.`,
      });
    },

    getPendingApprovals: (): OperationApproval[] => {
      // Mock data - replace with real backend call
      return [];
    },

    setUserRole: (userId: string, role: MaestroRole) => {
      // Mock function - replace with real backend call
      toast.success('Role Updated', {
        description: `User role changed to ${role}`,
      });
    },
  };
};
