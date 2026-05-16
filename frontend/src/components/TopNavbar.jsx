import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getNotificationsForUser, markNotificationRead } from '../utils/prService'
import { subscribeToConversations } from '../services/messageService'

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.log("Audio play failed", e);
  }
};

const PRIVILEGED_ROLES = ['Director', 'Senior Project Manager']

const TopNavbar = ({ currentUser, setCurrentUser, systemUsers = [], workers = [], setAuthenticated, onToggleSidebar }) => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)
  const unreadNotifCountRef = useRef(0)
  const lastMessageTimeRef = useRef(0)

  const loadNotifications = () => {
    if (currentUser?.id) {
      const notifs = getNotificationsForUser(currentUser.id, systemUsers)
      const currentUnread = notifs.filter(n => !n.read).length
      
      setNotifications(notifs)
      
      if (currentUnread > unreadNotifCountRef.current && unreadNotifCountRef.current > 0) {
        playNotificationSound()
      }
      unreadNotifCountRef.current = currentUnread
    } else {
      setNotifications([])
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 3000)
    
    let unsubscribeChats = () => {};
    if (currentUser?.id) {
      unsubscribeChats = subscribeToConversations(currentUser.id, (convs) => {
        let hasNewMessage = false;
        let highestTime = lastMessageTimeRef.current;
        let totalUnread = 0;

        convs.forEach(conv => {
          if (conv.lastMessage) {
            const msgTime = new Date(conv.lastMessage.createdAt).getTime();
            // Check if this message is newer than our tracked time AND not sent by us
            if (msgTime > lastMessageTimeRef.current && conv.lastMessage.senderId !== currentUser.id) {
              hasNewMessage = true;
            }
            if (msgTime > highestTime) highestTime = msgTime;
          }
          
          if (!conv.readBy?.includes(currentUser.id)) {
            totalUnread += 1;
          }
        });

        if (hasNewMessage && lastMessageTimeRef.current > 0) {
          playNotificationSound();
        }
        
        setUnreadChatCount(totalUnread);
        lastMessageTimeRef.current = highestTime;
      });
    }

    return () => {
      clearInterval(interval);
      unsubscribeChats();
    }
  }, [currentUser])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = (notif) => {
    markNotificationRead(notif.id)
    setShowNotif(false)
    loadNotifications()
    if (notif.type.startsWith('pr_')) {
      navigate(`/pr-detail/${notif.prRef}`)
    } else if (notif.type === 'work_update_comment') {
      navigate('/work-updates')
    }
  }

  const handleSwitchUser = (worker) => {
    setCurrentUser(worker)
    setShowUserMenu(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('alfa_authenticated');
    setAuthenticated(false);
    navigate('/login');
  };

  const isPrivileged = currentUser && PRIVILEGED_ROLES.includes(currentUser.role)
  
  // Resolve current user display info from workers if available
  const activeWorker = currentUser?.workerId ? workers.find(w => w.id === currentUser.workerId) : null;
  const currentDisplayName = activeWorker?.name || currentUser?.name || currentUser?.username || 'Unknown User';
  const currentDisplayInitials = activeWorker?.initials || currentUser?.initials || currentDisplayName.substring(0, 2).toUpperCase();

  // Avatar color based on role
  const avatarColor = isPrivileged ? 'bg-primary' : 'bg-slate-400'

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden text-slate-600 hover:bg-slate-100 p-2 rounded transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Search tasks, documents, or team..." type="text"/>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-slate-200 pr-6">
          {/* Messages Link */}
          <Link to="/messages" className="relative text-slate-600 hover:bg-slate-50 p-2 rounded transition-colors" title="Message to Team">
            <span className="material-symbols-outlined">chat_bubble</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                {unreadChatCount}
              </span>
            )}
          </Link>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative text-slate-600 hover:bg-slate-50 p-2 rounded transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-0.5">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">notifications_active</span>
                    <span className="font-black text-sm text-slate-900">Notifications</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{notifications.filter(n => !n.read).length}</span>
                    )}
                  </div>
                  <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                      <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                      <p className="text-xs font-bold">Belum ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotifClick(notif)}
                        className={`px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${!notif.read ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${!notif.read ? 'text-primary' : 'text-slate-500'}`}>
                                {notif.prRef}
                              </span>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {notif.type === 'pr_submitted' && 'Approval PR Baru'}
                              {notif.type === 'pr_approval1' && 'PR Butuh Final Approval'}
                              {notif.type === 'pr_ready_for_payment' && 'PR Siap Bayar (Selesai Approval)'}
                              {notif.type === 'pr_status_update' && `Status PR Update: ${notif.status || ''}`}
                              {notif.type === 'pr_paid' && 'PR Telah Dibayarkan (PAID)'}
                              {notif.type === 'work_update_comment' && `Komentar baru pada Work Update: ${notif.workUpdateTitle || 'Task'}`}
                              {(!notif.type.startsWith('pr_') && notif.type !== 'work_update_comment') && 'Notifikasi Baru'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Dari: <span className="font-bold text-slate-700">{notif.submittedBy || notif.commenterName}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="text-slate-600 hover:bg-slate-50 p-2 rounded transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>

        {/* User Profile + Switcher */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 leading-none">{currentDisplayName}</p>
              <p className={`text-[10px] font-black uppercase ${isPrivileged ? 'text-primary' : 'text-slate-500'}`}>
                {currentUser?.role || '—'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-black text-sm border-2 border-slate-100`}>
              {currentDisplayInitials}
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
          </button>

          {/* User Switcher Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Switch Active User</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Pilih user untuk simulasi role access</p>
              </div>
              <div className="divide-y divide-slate-50">
                {workers.filter(worker => systemUsers.some(u => u.workerId === worker.id)).map(worker => {
                  const linkedUser = systemUsers.find(u => u.workerId === worker.id);
                  const displayName = worker.name;
                  const displayInitials = worker.initials;
                  return (
                  <button
                    key={worker.id}
                    onClick={() => handleSwitchUser({ ...linkedUser, name: displayName, initials: displayInitials })}
                    className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left ${currentUser?.workerId === worker.id ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 ${PRIVILEGED_ROLES.includes(worker.role) ? 'bg-primary' : 'bg-slate-400'}`}>
                      {displayInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{displayName}</p>
                      <p className={`text-[10px] font-bold ${PRIVILEGED_ROLES.includes(worker.role) ? 'text-primary' : 'text-slate-400'}`}>{worker.role}</p>
                    </div>
                    {currentUser?.workerId === worker.id && (
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    )}
                    {PRIVILEGED_ROLES.includes(worker.role) && (
                      <span className="text-[8px] bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                    )}
                  </button>
                )})}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl text-xs font-black hover:bg-red-50 transition-all uppercase tracking-widest shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopNavbar
