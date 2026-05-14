import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Sidebar from './components/Sidebar'
import TopNavbar from './components/TopNavbar'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Budget from './pages/Budget'
import Settings from './pages/Settings'
import Forms from './pages/Forms'
import PurchaseRequest from './pages/PurchaseRequest'
import CashRequest from './pages/CashRequest'
import CostManagement from './pages/CostManagement'
import AHSPLibrary from './pages/AHSPLibrary'
import PRDetailPage from './pages/PRDetailPage'
import Login from './pages/Login'
import Invoice from './pages/Invoice'

function AppContent() {
  const location = useLocation()
  const activeTab = location.pathname.startsWith('/schedule') 
    ? 'schedule' 
    : location.pathname.startsWith('/budget') 
      ? 'budget' 
      : location.pathname.startsWith('/settings')
        ? 'settings'
        : location.pathname.startsWith('/forms')
          ? 'forms'
          : location.pathname.startsWith('/cost-management')
            ? 'cost-management'
            : location.pathname.startsWith('/ahsp-library')
              ? 'ahsp-library'
              : location.pathname.startsWith('/invoice')
                ? 'invoice'
                : 'dashboard'

  const [isAuthenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem('alfa_authenticated') === 'true';
  });

  const [dataLoaded, setDataLoaded] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  // Initialize state with empty or default values
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ id: 'usr-admin', name: 'Admin', role: 'Admin', initials: 'AD' });

  // Load from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'appState', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.projects && data.projects.length > 0) {
            const sanitizedProjects = data.projects.map(p => {
              if (p.name === 'Tokyo Riverside Apartment' && !p.code) {
                return { ...p, code: 'PRJ-2024-001' };
              }
              return p;
            });
            setProjects(sanitizedProjects);
          } else setProjects([{ id: 1, name: 'Tokyo Riverside Apartment', client: 'Tokyo Dev', projectType: 'Residential', code: 'PRJ-2024-001', status: 'On Track', progress: 85, budget: '4200000000', billingType: 'Fixed', startDate: '2026-04-01', endDate: '2027-04-01', projectManager: 'Sarah Dorsey', icon: 'foundation', color: 'blue', milestones: [] }]);
          
          if (data.workers) setWorkers(data.workers);
          
          if (data.systemUsers && data.systemUsers.length > 0) setSystemUsers(data.systemUsers);
          else setSystemUsers([{ id: 'usr-admin', workerId: null, username: 'Admin', email: 'admin@projectalfa.com', password: 'password123', role: 'Admin', status: 'Active' }]);

          if (data.currentUser) setCurrentUser(data.currentUser);
        } else {
          setProjects([{ id: 1, name: 'Tokyo Riverside Apartment', client: 'Tokyo Dev', projectType: 'Residential', code: 'PRJ-2024-001', status: 'On Track', progress: 85, budget: '4200000000', billingType: 'Fixed', startDate: '2026-04-01', endDate: '2027-04-01', projectManager: 'Sarah Dorsey', icon: 'foundation', color: 'blue', milestones: [] }]);
          setSystemUsers([{ id: 'usr-admin', workerId: null, username: 'Admin', email: 'admin@projectalfa.com', password: 'password123', role: 'Admin', status: 'Active' }]);
        }
      } catch (error) {
        console.error("Error loading data from Firebase:", error);
        setFirebaseError(error.message);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded && !firebaseError) {
      setDoc(doc(db, 'appState', 'main'), { projects, workers, currentUser, systemUsers }, { merge: true }).catch(console.error);
    }
  }, [projects, workers, currentUser, systemUsers, dataLoaded, firebaseError]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login setAuthenticated={setAuthenticated} systemUsers={systemUsers} setCurrentUser={setCurrentUser} />} />
      </Routes>
    );
  }

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
      <Sidebar activeTab={activeTab} currentUser={currentUser} />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TopNavbar currentUser={currentUser} setCurrentUser={setCurrentUser} systemUsers={systemUsers} workers={workers} setAuthenticated={setAuthenticated} />
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} setProjects={setProjects} workers={workers} currentUser={currentUser} />} />
          <Route path="/schedule" element={<Schedule projects={projects} />} />
          <Route path="/budget" element={<Budget projects={projects} currentUser={currentUser} />} />
          <Route path="/cost-management" element={<CostManagement projects={projects} currentUser={currentUser} />} />
          <Route path="/ahsp-library" element={<AHSPLibrary currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings projects={projects} setProjects={setProjects} workers={workers} setWorkers={setWorkers} currentUser={currentUser} systemUsers={systemUsers} setSystemUsers={setSystemUsers} />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/invoice" element={<Invoice projects={projects} currentUser={currentUser} />} />
          <Route path="/forms/purchase-request/:refNo?" element={<PurchaseRequest projects={projects} workers={workers} currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="/forms/cash-request/:refNo?" element={<CashRequest projects={projects} workers={workers} currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="/pr-detail/:prId" element={<PRDetailPage currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="/login" element={<Login setAuthenticated={setAuthenticated} systemUsers={systemUsers} setCurrentUser={setCurrentUser} />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
