import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar = ({ activeTab, currentUser }) => {
  const isAdmin = currentUser?.role === 'Admin'

  return (
    <aside className="h-screen w-64 border-r fixed left-0 top-0 bg-[#EFEFEF] dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-50 flex flex-col py-4 space-y-2">
      <div className="px-6 mb-8 mt-4 flex items-center justify-center">
        <img src="/proman-logo.png" alt="PROMAN" className="w-full max-w-[180px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <Link 
          to="/" 
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
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'budget' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">payments</span>
          <span className="font-medium text-sm">Budget</span>
        </Link>
        <Link 
          to="/cost-management" 
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
          className={`flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ease-in-out ${
            activeTab === 'ahsp-library' 
              ? 'bg-[#BF6604]/10 text-[#BF6604] border-r-4 border-[#BF6604] font-bold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="material-symbols-outlined">library_books</span>
          <span className="font-medium text-sm">AHSP Library</span>
        </Link>
        <a className="flex items-center gap-3 px-4 py-3 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 ease-in-out" href="#">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-medium text-sm">Reports</span>
        </a>
        <Link 
          to="/forms" 
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
  )
}

export default Sidebar
