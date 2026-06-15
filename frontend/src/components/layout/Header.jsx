import { Search, Bell, Sun, Moon, Menu, LogOut, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { socketService } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'

export default function Header({ theme, toggleTheme, onMenuClick }) {
  const { user, logout } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const socket = socketService.connect();
    
    const handleNotification = (message) => {
      setNotifCount(prev => prev + 1);
    };

    socket.on('project_notification', handleNotification);

    return () => {
      socket.off('project_notification', handleNotification);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const displayRole = (role) => {
    if (!role) return '';
    return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <header className="header">
      {/* Hamburger — mobile only */}
      <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={18} />
      </button>

      {/* Search bar */}
      <div className="header-search">
        <Search size={14} color="var(--text-subtle)" />
        <input placeholder="Search projects, tasks…" aria-label="Search" />
        <span className="kbd">⌘K</span>
      </div>

      {/* Right-side actions */}
      <div className="header-actions">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{ transition: 'transform 0.3s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(20deg)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button 
          className="icon-btn" 
          aria-label="Notifications" 
          style={{ position: 'relative' }}
          onClick={() => setNotifCount(0)}
        >
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="notif-badge" style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'var(--red)',
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 2px'
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

        {/* Profile Dropdown Container */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div 
            className="user-info" 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="user-avatar" aria-label="User menu">
              {getInitials(user?.name)}
            </div>
            <div>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{displayRole(user?.role)}</div>
            </div>
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 10,
              width: 180,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 1000,
              padding: '6px 0',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)'
              }}>
                Signed in as <strong>{user?.email}</strong>
              </div>
              
              <button 
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 13,
                  color: 'var(--red)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
