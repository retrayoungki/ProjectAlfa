import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar = ({ activeTab, currentUser, isOpen, onClose }) => {
  const isAdmin = currentUser?.role === 'Admin'

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`h-screen w-64 border-r fixed left-0 top-0 bg-[#EFEFEF] dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-50 flex flex-col py-4 space-y-2 transition-transform duration-300 ease-in-out print:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="px-6 mb-8 mt-4 flex items-center justify-center">
        <img src="/proman-logo.png" alt="PROMAN" className="w-full max-w-[180px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-md" />
      </div>
      <nav className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-1 px-3 pb-2">
        <Link 
          to="/" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'dashboard' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">construction</span>
          <span className="font-medium text-sm">Projects</span>
        </Link>
        <Link 
          to="/schedule" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'schedule' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="font-medium text-sm">Schedule</span>
        </Link>
        <Link 
          to="/budget" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'budget' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">payments</span>
          <span className="font-medium text-sm">Cost Of Production</span>
        </Link>
        <Link 
          to="/work-updates" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'work-updates' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">assignment_turned_in</span>
          <span className="font-medium text-sm">Work Updates</span>
        </Link>
        <Link 
          to="/messages" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'messages' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-medium text-sm">Message to Team</span>
        </Link>
        <Link 
          to="/cost-management" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'cost-management' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">calculate</span>
          <span className="font-medium text-sm">Cost Engine</span>
        </Link>
        <Link 
          to="/ahsp-library" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'ahsp-library' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">library_books</span>
          <span className="font-medium text-sm">AHSP Library</span>
        </Link>
        <Link 
          to="/reports" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'reports' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-medium text-sm">Reports</span>
        </Link>
        <Link 
          to="/forms" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'forms' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">description</span>
          <span className="font-medium text-sm">Forms</span>
        </Link>

        {['Admin', 'Director', 'Senior Project Manager'].includes(currentUser?.role) && (
          <Link 
            to="/invoice" 
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
              activeTab === 'invoice' 
                ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[#BF6604]">receipt</span>
            <span className="font-medium text-sm">Invoice</span>
          </Link>
        )}
      </nav>
      <div className="px-4 mt-auto space-y-1 border-t border-slate-200 pt-4">
        <button className="w-full mb-4 bg-primary text-white py-2.5 rounded font-bold text-sm shadow-sm active:translate-y-px transition-all">
          New Report
        </button>
        <Link 
          to="/settings" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-2 rounded transition-all duration-200 ease-in-out text-sm ${
            activeTab === 'settings' 
              ? 'bg-[#8A4A00]/10 text-[#8A4A00] border-r-4 border-[#8A4A00] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </Link>
        <a className="flex items-center gap-3 px-4 py-2 rounded text-slate-600 hover:bg-slate-100 text-sm" href="#">
          <span className="material-symbols-outlined">contact_support</span>
          <span>Support</span>
        </a>
      </div>
      </aside>
    </>
  )
}

export default Sidebar
