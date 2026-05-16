// ─── RBAC — Role-Based Access Control ─────────────────────────────────────────
// Single source of truth for all role permissions in the application.

export const ROLES = {
  DIRECTOR: 'Director',
  SENIOR_PM: 'Senior Project Manager',
  PROJECT_MANAGER: 'Project Manager',
  QS_MANAGER: 'QS Manager',
  ADMIN: 'Admin',
}

/** Roles that receive PR notifications and can approve */
export const APPROVER_ROLES = [ROLES.DIRECTOR, ROLES.SENIOR_PM]

/** Approval level per role (null = cannot approve) */
export const APPROVAL_LEVEL = {
  [ROLES.DIRECTOR]: 2,          // Final approval
  [ROLES.SENIOR_PM]: 1,         // First approval
  [ROLES.PROJECT_MANAGER]: null, // No approval rights
  [ROLES.ADMIN]: null,           // No approval rights
}

/**
 * Permissions matrix
 * canCreate   — can submit a new PR
 * canApprove  — can click Approve / Reject / Pending on a PR
 * canViewAll  — can see all PRs in dashboard
 * canEditAHSP — can add/edit/delete AHSP library items
 */
const PERMISSIONS = {
  [ROLES.DIRECTOR]: {
    canCreate: true,
    canApprove: true,
    canViewAll: true,
    canEditAHSP: true,
    canViewAllWorkUpdates: true,
    canManageWorkUpdates: true,
    approvalLevel: 2,
    label: 'Approval 2 + Submit',
  },
  [ROLES.SENIOR_PM]: {
    canCreate: true,
    canApprove: true,
    canViewAll: true,
    canEditAHSP: true,
    canViewAllWorkUpdates: true,
    canManageWorkUpdates: true,
    approvalLevel: 1,
    label: 'Approval 1 + Submit',
  },
  [ROLES.PROJECT_MANAGER]: {
    canCreate: true,
    canApprove: false,
    canViewAll: false,
    canEditAHSP: true,
    canViewAllWorkUpdates: true,
    canManageWorkUpdates: true,
    approvalLevel: null,
    label: 'Submit Only',
  },
  [ROLES.QS_MANAGER]: {
    canCreate: true,
    canApprove: false,
    canViewAll: true,
    canEditAHSP: true,
    canViewAllWorkUpdates: true,
    canManageWorkUpdates: false,
    approvalLevel: null,
    label: 'QS Manager',
  },
  [ROLES.ADMIN]: {
    canCreate: true,
    canApprove: false,
    canViewAll: true,
    canEditAHSP: false,
    canViewAllWorkUpdates: true,
    canManageWorkUpdates: false,
    approvalLevel: null,
    label: 'View & Submit',
  },
}

/** Get all permissions for a role */
export const getPermissions = (role) =>
  PERMISSIONS[role] || PERMISSIONS[ROLES.ADMIN]

/** Check if a role can approve PRs */
export const canApprove = (role) => getPermissions(role).canApprove

/** Check if a role can create/submit PRs */
export const canCreate = (role) => getPermissions(role).canCreate

/** Check if a role can see all PRs (not just their own) */
export const canViewAll = (role) => getPermissions(role).canViewAll

/** Check if a role can edit AHSP Library */
export const canEditAHSP = (role) => getPermissions(role).canEditAHSP

/** Check if a role can view all work updates across all projects */
export const canViewAllWorkUpdates = (role) => getPermissions(role).canViewAllWorkUpdates

/** Check if a role can manage (approve/comment) work updates */
export const canManageWorkUpdates = (role) => getPermissions(role).canManageWorkUpdates

/** Get approval level (1, 2, or null) */
export const getApprovalLevel = (role) => APPROVAL_LEVEL[role] ?? null

/** Human-readable permission label */
export const getPermissionLabel = (role) => getPermissions(role).label

/** Badge color for role chip */
export const getRoleBadgeStyle = (role) => {
  switch (role) {
    case ROLES.DIRECTOR:    return 'bg-purple-100 text-purple-700 border-purple-200'
    case ROLES.SENIOR_PM:   return 'bg-blue-100 text-blue-700 border-blue-200'
    case ROLES.PROJECT_MANAGER: return 'bg-teal-100 text-teal-700 border-teal-200'
    case ROLES.QS_MANAGER:  return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case ROLES.ADMIN:       return 'bg-slate-100 text-slate-600 border-slate-200'
    default:                return 'bg-slate-100 text-slate-500 border-slate-100'
  }
}
