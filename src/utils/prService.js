// ─── PR Service — Purchase Request business logic ──────────────────────────────
import { APPROVER_ROLES, getApprovalLevel, ROLES } from './rbac'

const PR_KEY      = 'alfa_purchase_requests'
const NOTIF_KEY   = 'alfa_notifications'

// ── Helpers ────────────────────────────────────────────────────────────────────

export const getAllPRs = () => {
  try { 
    const prs = JSON.parse(localStorage.getItem(PR_KEY) || '[]')
    return prs.map(pr => {
      if (pr.status === 'Approved (SPM)') pr.status = 'Waiting Final Approval'
      return pr
    })
  } catch { 
    return [] 
  }
}

export const savePRs = (prs) => {
  localStorage.setItem(PR_KEY, JSON.stringify(prs))
}

export const getAllNotifications = () => {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') } catch { return [] }
}

export const saveNotifications = (notifs) => {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs))
}

/**
 * Internal helper to push a new notification to the system.
 */
const createNotification = (data) => {
  const notifs = getAllNotifications()
  notifs.push({
    id: `notif-${Date.now()}-${data.recipientId}-${Math.floor(Math.random() * 1000)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...data
  })
  saveNotifications(notifs)
}

// ── PR Status Helpers ──────────────────────────────────────────────────────────

/**
 * Compute the human-readable status label from a PR object.
 *
 * Status lifecycle:
 *   Draft → Pending Approval → Approved (Approval 1) → Fully Approved
 *                                                     → Rejected
 *                            → Pending (held)
 *                            → Rejected
 */
export const computeStatus = (pr) => {
  if (!pr.approval1 && !pr.approval2) return 'Pending Approval'
  if (pr.payment?.paidAt) return 'Paid'
  if (pr.approval2?.decision === 'Approved') return 'Fully Approved'
  if (pr.approval2?.decision === 'Rejected') return 'Rejected'
  if (pr.approval2?.decision === 'Pending')  return 'On Hold'
  if (pr.approval1?.decision === 'Approved') return 'Waiting Final Approval'
  if (pr.approval1?.decision === 'Rejected') return 'Rejected'
  if (pr.approval1?.decision === 'Pending')  return 'On Hold'
  return 'Pending Approval'
}

export const STATUS_STYLES = {
  'Pending Approval': 'bg-amber-100 text-amber-700 border-amber-200',
  'Waiting Final Approval': 'bg-blue-100 text-blue-700 border-blue-200',
  'Fully Approved':   'bg-green-100 text-green-700 border-green-200',
  'Rejected':         'bg-red-100 text-red-700 border-red-200',
  'On Hold':          'bg-slate-100 text-slate-500 border-slate-200',
  'Draft':            'bg-slate-100 text-slate-400 border-slate-200',
  'Paid':             'bg-emerald-100 text-emerald-700 border-emerald-300',
}

// ── Core Operations ────────────────────────────────────────────────────────────

/**
 * Submit a new PR.
 * Creates the PR record and generates notifications for all approver-role system users.
 *
 * @param {object} prData       — PR fields
 * @param {object} submittedBy  — currentUser object { id, name, role, username }
 * @param {Array}  systemUsers  — full list of system users (to find approvers)
 * @returns {object} the saved PR
 */
export const submitPR = (prData, submittedBy, systemUsers = []) => {
  const pr = {
    ...prData,
    status: 'Pending Approval',
    submittedAt: new Date().toISOString(),
    submittedBy: prData.requestedBy || submittedBy?.name || submittedBy?.username || 'System',
    submittedById: submittedBy?.id,
    submittedByRole: submittedBy?.role,
    approval1: null,  // { by, decision, comment, at }
    approval2: null,
  }

  const prs = getAllPRs()
  const idx = prs.findIndex(p => p.refNo === pr.refNo)
  if (idx >= 0) prs[idx] = pr
  else prs.push(pr)
  savePRs(prs)

  // Create notifications for all Director + Senior PM users
  const approverUsers = systemUsers.filter(u =>
    APPROVER_ROLES.includes(u.role) && u.status === 'Active'
  )

  approverUsers.forEach(u => {
    createNotification({
      type: 'pr_submitted',
      prId: pr.refNo,
      prRef: pr.refNo,
      vendor: pr.vendor,
      project: pr.project,
      total: pr.total,
      submittedBy: pr.submittedBy,
      recipientId: u.id,
      recipientRole: u.role,
    })
  })

  return pr
}

/**
 * Apply an approval decision to a PR.
 *
 * @param {string} prRef      — refNo of the PR
 * @param {object} approver   — currentUser { id, name, username, role }
 * @param {'Approved'|'Rejected'|'Pending'} decision
 * @param {string} comment    — optional comment
 * @param {Array}  systemUsers
 */
export const applyApproval = (prRef, approver, decision, comment = '', systemUsers = []) => {
  const level = getApprovalLevel(approver.role)
  if (!level) return null

  const prs = getAllPRs()
  const pr  = prs.find(p => p.refNo === prRef)
  if (!pr) return null

  const entry = {
    by: approver.name || approver.username || approver.id,
    role: approver.role,
    decision,
    comment,
    at: new Date().toISOString(),
  }

  if (level === 1) pr.approval1 = entry
  if (level === 2) pr.approval2 = entry

  pr.status = computeStatus(pr)
  savePRs(prs)

  // Mark all related notifications for this approver as read
  markRelatedNotifsRead(prRef, approver.id)

  // If Approval 1 just happened and was Approved, notify Director-level users
  if (level === 1 && decision === 'Approved') {
    const directors = systemUsers.filter(u =>
      u.role === ROLES.DIRECTOR && u.status === 'Active'
    )
    directors.forEach(u => {
      createNotification({
        type: 'pr_approval1',
        prId: prRef,
        prRef,
        vendor: pr.vendor,
        project: pr.project,
        total: pr.total,
        submittedBy: pr.submittedBy,
        recipientId: u.id,
        recipientRole: u.role,
      })
    })
  }

  // If Approval 2 just happened and was Approved (Final), notify Admin users for payment
  if (level === 2 && decision === 'Approved') {
    const admins = systemUsers.filter(u =>
      u.role === ROLES.ADMIN && u.status === 'Active'
    )
    admins.forEach(u => {
      createNotification({
        type: 'pr_ready_for_payment',
        prId: prRef,
        prRef,
        vendor: pr.vendor,
        project: pr.project,
        total: pr.total,
        submittedBy: pr.submittedBy,
        recipientId: u.id,
        recipientRole: u.role,
      })
    })
  }

  // ALWAYS notify the requester of status updates
  if (pr.submittedById) {
    createNotification({
      type: 'pr_status_update',
      prId: prRef,
      prRef,
      status: pr.status,
      decision,
      comment,
      recipientId: pr.submittedById,
      recipientRole: pr.submittedByRole,
    })
  }

  return pr
}

/**
 * Apply payment to a Fully Approved PR.
 * Only Admin role can call this.
 *
 * @param {string} prRef    — refNo of the PR
 * @param {object} admin    — currentUser { id, name, username, role }
 * @param {string} notes    — optional payment notes
 */
export const applyPayment = (prRef, admin, notes = '') => {
  if (admin?.role !== 'Admin') return null

  const prs = getAllPRs()
  const pr  = prs.find(p => p.refNo === prRef)
  if (!pr) return null

  // Must be Fully Approved first
  if (pr.approval2?.decision !== 'Approved') return null

  pr.payment = {
    by:    admin.name || admin.username || admin.id,
    role:  admin.role,
    notes,
    paidAt: new Date().toISOString(),
  }
  pr.status = computeStatus(pr)
  savePRs(prs)

  // Notify requester of payment
  if (pr.submittedById) {
    createNotification({
      type: 'pr_paid',
      prId: prRef,
      prRef,
      status: 'Paid',
      recipientId: pr.submittedById,
      recipientRole: pr.submittedByRole,
    })
  }

  return pr
}

/**
 * Get unread notification count for a user.
 */
export const getUnreadCount = (userId, systemUsers = []) => {
  return getNotificationsForUser(userId, systemUsers).filter(n => !n.read).length
}

/**
 * Get notifications for a specific user (newest first).
 * Dynamically includes pending PRs that might have missed the submission event.
 */
export const getNotificationsForUser = (userId, systemUsers = []) => {
  const notifs = getAllNotifications()
  const prs = getAllPRs()
  
  // Find the current user to get their role
  const user = systemUsers.find(u => u.id === userId)
  const isApprover = user && APPROVER_ROLES.includes(user.role)
  const level = isApprover ? getApprovalLevel(user.role) : null

  // If user is an approver, check if any PRs are waiting for their action
  if (isApprover) {
    prs.forEach(pr => {
      // Check if PR needs this user's approval
      const needsApp1 = level === 1 && !pr.approval1 && pr.status !== 'Draft'
      const needsApp2 = level === 2 && pr.approval1?.decision === 'Approved' && !pr.approval2
      
      if (needsApp1 || needsApp2) {
        // Ensure a notification exists
        const exists = notifs.some(n => n.prId === pr.refNo && n.recipientId === userId && !n.read)
        if (!exists) {
          notifs.push({
            id: `auto-notif-${pr.refNo}-${userId}`,
            type: 'pr_submitted',
            prId: pr.refNo,
            prRef: pr.refNo,
            vendor: pr.vendor,
            project: pr.project,
            total: pr.total,
            submittedBy: pr.submittedBy || pr.requestedBy,
            recipientId: userId,
            recipientRole: user.role,
            read: false,
            createdAt: pr.submittedAt || new Date().toISOString(),
          })
        }
      }
    })
  }

  return notifs
    .filter(n => n.recipientId === userId)
    .map(n => {
      // Patch 'Unknown' sender with actual requestedBy from PR if available
      if (!n.submittedBy || n.submittedBy === 'Unknown') {
        const pr = prs.find(p => p.refNo === n.prId)
        return { ...n, submittedBy: pr?.requestedBy || 'System' }
      }
      return n
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = (notifId) => {
  const notifs = getAllNotifications()
  const updated = notifs.map(n => n.id === notifId ? { ...n, read: true } : n)
  saveNotifications(updated)
}

/**
 * Mark all notifications as read for a user.
 */
export const markAllRead = (userId) => {
  const notifs = getAllNotifications()
  const updated = notifs.map(n =>
    n.recipientId === userId ? { ...n, read: true } : n
  )
  saveNotifications(updated)
}

/**
 * Mark related PR notifications as read for a specific user.
 */
const markRelatedNotifsRead = (prRef, userId) => {
  const notifs = getAllNotifications()
  const updated = notifs.map(n =>
    (n.prId === prRef && n.recipientId === userId) ? { ...n, read: true } : n
  )
  saveNotifications(updated)
}
/**
 * Get total spending (PR + CR) for a project.
 * Excludes rejected requests.
 */
export const getProjectSpending = (projectName) => {
  const prs = getAllPRs().filter(p => p.project === projectName)
  const totalSpent = prs.reduce((acc, pr) => {
    // Check both approval levels for rejection
    const isRejected = pr.approval1?.decision === 'Rejected' || pr.approval2?.decision === 'Rejected'
    if (isRejected) return acc
    return acc + (pr.total || 0)
  }, 0)
  return totalSpent
}

export const deletePR = (refNo) => {
  const prs = getAllPRs()
  const filtered = prs.filter(p => p.refNo !== refNo)
  if (prs.length !== filtered.length) {
    savePRs(filtered)
    return true
  }
  return false
}

