import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout components
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileBottomNav from './components/layout/MobileBottomNav'

// Pages
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects  from './pages/Projects'
import ProjectDetail from './pages/Projects/ProjectDetail'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import FinancePage from './pages/FinancePage'
import ClientsPage from './pages/ClientsPage'
import ClientDetail from './pages/ClientDetail'
import TimesheetPage from './pages/TimesheetPage'
import Documents from './pages/Documents'
import Team      from './pages/Team'
import TeamDetail from './pages/Team/TeamDetail'
import CostEstimation from './pages/CostEstimation'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div>Loading ProMan...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function MainLayout({ collapsed, setCollapsed, mobileOpen, setMobileOpen, theme, toggleTheme }) {
  const closeMobile = () => setMobileOpen(false);
  
  return (
    <>
      <div
        className={`sidebar-overlay${mobileOpen ? ' show' : ''}`}
        onClick={closeMobile}
      />

      <div className="app-layout">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          closeMobile={closeMobile}
        />

        <div className="main-area">
          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            onMenuClick={() => setMobileOpen(o => !o)}
          />
          <main className="page-content page-fade">
            <Routes>
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects"  element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/tasks"     element={<TasksPage />} />
              <Route path="/calendar"  element={<CalendarPage />} />
              <Route path="/finance"   element={<FinancePage />} />
              <Route path="/clients"   element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/timesheet"         element={<TimesheetPage />} />
              <Route path="/timesheet/me"      element={<TimesheetPage myTimesheetOnly={true} />} />
              <Route path="/documents"         element={<Documents />} />
              <Route path="/team"              element={<Team />} />
              <Route path="/team/:id"          element={<TeamDetail />} />
              <Route path="/cost-estimation"   element={<CostEstimation />} />
            </Routes>
          </main>
        </div>
      </div>

      <MobileBottomNav closeMobile={closeMobile} />
    </>
  );
}

export default function App() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [theme,       setTheme]       = useState('light')

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
