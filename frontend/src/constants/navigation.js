// Navigasi sidebar — satu sumber kebenaran untuk seluruh app
// Tambah/hapus menu di sini, otomatis terefleksi di Sidebar & MobileBottomNav

import {
  LayoutDashboard, FolderKanban, CheckSquare, Calendar,
  Users, UserCheck, Clock, DollarSign, FileText, BarChart3, Settings, Calculator,
} from 'lucide-react'

// Menu utama sidebar (semua grup)
export const SIDEBAR_NAV = [
  {
    section: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FolderKanban,    label: 'Projects',  path: '/projects' },
      { icon: CheckSquare,     label: 'Tasks',     path: '/tasks' },
      { icon: Calendar,        label: 'Calendar',  path: '/calendar' },
    ],
  },
  {
    section: 'PEOPLE',
    items: [
      { icon: Users,     label: 'Clients',   path: '/clients' },
      { icon: UserCheck, label: 'Team',      path: '/team' },
      { icon: Clock,     label: 'Timesheet', path: '/timesheet' },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { icon: DollarSign,  label: 'Finance',          path: '/finance' },
      { icon: Calculator,  label: 'Cost Estimation',   path: '/cost-estimation' },
      { icon: FileText,    label: 'Documents',         path: '/documents' },
      { icon: BarChart3,   label: 'Reports',           path: '/reports' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
]

// 5 item bottom nav mobile (pilih yang paling sering diakses)
export const BOTTOM_NAV = [
  { icon: LayoutDashboard, label: 'Home',     path: '/dashboard' },
  { icon: FolderKanban,    label: 'Projects', path: '/projects' },
  { icon: CheckSquare,     label: 'Tasks',    path: '/tasks' },
  { icon: DollarSign,      label: 'Finance',  path: '/finance' },
  { icon: Users,           label: 'Clients',  path: '/clients' },
]
