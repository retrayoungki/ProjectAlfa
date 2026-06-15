import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SIDEBAR_NAV } from '../../constants/navigation'
import ProManLogo from '../icons/ProManLogo'
import { fetchGlobalTasks } from '../../services/taskService'
import { fetchProjects } from '../../services/projectService'
import dayjs from 'dayjs'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, closeMobile }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user } = useAuth()
  const isPMOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'SENIOR_PROJECT_MANAGER';
  const [overdueCount, setOverdueCount] = useState(0)
  const [nearDeadlineCount, setNearDeadlineCount] = useState(0)
  const [pendingTimesheetsCount, setPendingTimesheetsCount] = useState(0)

  const handleNav = (path) => {
    navigate(path)
    closeMobile()
  }

  // Poll overdue tasks count
  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const res = await fetchGlobalTasks({ overdue: true, limit: 1 })
        if (res && res.summary) {
          setOverdueCount(res.summary.overdue || 0)
        }
      } catch (err) {
        console.error('Failed to fetch overdue count in Sidebar:', err)
        // If unauthorized or token expired, default to 0
        setOverdueCount(0)
      }
    }

    fetchOverdue()
    const interval = setInterval(fetchOverdue, 30000) // 30 seconds poll

    return () => clearInterval(interval)
  }, [location.pathname]) // Refetch on route change to keep it up to date

  // Poll project deadlines (within 7 days)
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const res = await fetchProjects({ limit: 100 })
        if (res && res.data) {
          const today = dayjs().startOf('day')
          const sevenDaysLater = today.add(7, 'day').endOf('day')
          
          const count = res.data.filter(p => {
            if (!p.contractEndDate || p.status === 'completed' || p.status === 'on_hold') return false;
            const endDate = dayjs(p.contractEndDate)
            const isAfterOrSame = endDate.isAfter(today) || endDate.isSame(today, 'day')
            const isBeforeOrSame = endDate.isBefore(sevenDaysLater) || endDate.isSame(sevenDaysLater, 'day')
            return isAfterOrSame && isBeforeOrSame
          }).length
          
          setNearDeadlineCount(count)
        }
      } catch (err) {
        console.error('Failed to fetch near deadlines in Sidebar:', err)
        setNearDeadlineCount(0)
      }
    }

    fetchDeadlines()
    const interval = setInterval(fetchDeadlines, 30000) // 30 seconds poll

    return () => clearInterval(interval)
  }, [location.pathname])

  // Poll pending timesheets count for Admin/PM
  useEffect(() => {
    const fetchPendingTimesheetsCount = async () => {
      if (!isPMOrAdmin) {
        setPendingTimesheetsCount(0);
        return;
      }
      try {
        const token = localStorage.getItem('proman_token');
        const res = await fetch('/api/timesheet/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const list = await res.json();
          setPendingTimesheetsCount(list.length);
        }
      } catch (err) {
        console.error('Failed to fetch pending timesheets count in Sidebar:', err);
        setPendingTimesheetsCount(0);
      }
    };

    fetchPendingTimesheetsCount();
    const interval = setInterval(fetchPendingTimesheetsCount, 30000); // 30 seconds poll

    return () => clearInterval(interval);
  }, [location.pathname, isPMOrAdmin]);

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <ProManLogo height={46} collapsed={collapsed} />
        {/* Close button — only visible on mobile */}
        <button className="mobile-close-btn" onClick={closeMobile} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Navigation groups */}
      <div className="sidebar-nav">
        {SIDEBAR_NAV.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => {
              const Icon   = item.icon
              const active = location.pathname === item.path
              const isTasks = item.path === '/tasks'
              const isCalendar = item.path === '/calendar'
              const isTimesheet = item.path === '/timesheet'
              
              const showBadge = (isTasks && overdueCount > 0) || (isCalendar && nearDeadlineCount > 0) || (isTimesheet && pendingTimesheetsCount > 0)
              const badgeCount = isTasks ? overdueCount : (isCalendar ? nearDeadlineCount : pendingTimesheetsCount)
              const badgeColor = isTimesheet ? '#f59e0b' : '#E24B4A' // amber for timesheet, red for tasks/calendar

              return (
                <button
                  key={item.path}
                  className={`nav-item${active ? ' active' : ''}`}
                  onClick={() => handleNav(item.path)}
                  title={collapsed ? item.label : ''}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                >
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Icon className="nav-icon" size={18} />
                    {showBadge && collapsed && (
                      <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: badgeColor,
                        borderRadius: '50%',
                        border: '1.5px solid #111827'
                      }} />
                    )}
                  </div>
                  <span className="nav-label">{item.label}</span>
                  {showBadge && !collapsed && (
                    <span style={{
                      marginLeft: 'auto',
                      backgroundColor: badgeColor,
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '18px',
                      height: '18px',
                      lineHeight: '1',
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Collapse toggle — desktop only */}
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          <span className="nav-label" style={{ fontSize: 12.5 }}>Collapse</span>
        </button>
      </div>
    </nav>
  )
}
