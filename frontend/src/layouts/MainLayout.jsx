import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser, setCurrentUser, systemUsers, workers, firebaseError, setFirebaseError } = useData();
  const { setAuthenticated } = useAuth();

  const activeTab = location.pathname.startsWith('/schedule') 
    ? 'schedule' 
    : location.pathname.startsWith('/budget') 
      ? 'budget' 
      : location.pathname.startsWith('/settings')
        ? 'settings'
        : location.pathname.startsWith('/forms')
          ? 'forms'
          : location.pathname.startsWith('/work-updates')
            ? 'work-updates'
            : location.pathname.startsWith('/cost-management')
            ? 'cost-management'
            : location.pathname.startsWith('/ahsp-library')
              ? 'ahsp-library'
              : location.pathname.startsWith('/reports')
                ? 'reports'
                : location.pathname.startsWith('/invoice')
                  ? 'invoice'
                  : 'dashboard';

  return (
    <div className="bg-[#BCBCBC] font-body-md text-on-surface min-h-screen">
      {firebaseError && (
        <div className="bg-red-500 text-white p-4 fixed top-0 left-0 w-full z-[100] font-bold shadow-lg flex items-center justify-between">
          <span>
            <span className="material-symbols-outlined mr-2 align-middle">error</span>
            Firebase Connection Error: {firebaseError}
          </span>
          <button onClick={() => setFirebaseError(null)} className="opacity-80 hover:opacity-100">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
      <Sidebar activeTab={activeTab} currentUser={currentUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 md:ml-64`}>
        <TopNavbar 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          systemUsers={systemUsers} 
          workers={workers} 
          setAuthenticated={setAuthenticated} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 w-full relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
