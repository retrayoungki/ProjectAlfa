import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Schedule = lazy(() => import('../pages/Schedule'));
const Budget = lazy(() => import('../pages/Budget'));
const Settings = lazy(() => import('../pages/Settings'));
const Forms = lazy(() => import('../pages/Forms'));
const PurchaseRequest = lazy(() => import('../pages/PurchaseRequest'));
const CashRequest = lazy(() => import('../pages/CashRequest'));
const WorkUpdates = lazy(() => import('../pages/WorkUpdates'));
const Messages = lazy(() => import('../pages/Messages'));
const CostManagement = lazy(() => import('../pages/CostManagement'));
const AHSPLibrary = lazy(() => import('../pages/AHSPLibrary'));
const PRDetailPage = lazy(() => import('../pages/PRDetailPage'));
const Login = lazy(() => import('../pages/Login'));
const Invoice = lazy(() => import('../pages/Invoice'));
const Reports = lazy(() => import('../pages/Reports'));

// Premium Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute top-2 left-2 w-12 h-12 border-4 border-secondary/20 border-b-secondary rounded-full animate-spin-slow"></div>
    </div>
    <p className="mt-4 text-on-surface/60 font-medium animate-pulse">Loading experience...</p>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated, setAuthenticated } = useAuth();
  const { projects, setProjects, workers, setWorkers, currentUser, setCurrentUser, systemUsers, setSystemUsers } = useData();

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="*" element={<Login setAuthenticated={setAuthenticated} systemUsers={systemUsers} setCurrentUser={setCurrentUser} />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard projects={projects} setProjects={setProjects} workers={workers} currentUser={currentUser} />} />
          <Route path="/schedule" element={<Schedule projects={projects} />} />
          <Route path="/work-updates" element={<WorkUpdates projects={projects} currentUser={currentUser} />} />
          <Route path="/messages" element={<Messages currentUser={currentUser} projects={projects} workers={workers} systemUsers={systemUsers} />} />
          <Route path="/budget" element={<Budget projects={projects} currentUser={currentUser} />} />
          <Route path="/cost-management" element={<CostManagement projects={projects} setProjects={setProjects} currentUser={currentUser} />} />
          <Route path="/ahsp-library" element={<AHSPLibrary currentUser={currentUser} />} />
          <Route path="/reports" element={<Reports projects={projects} setProjects={setProjects} currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings projects={projects} setProjects={setProjects} workers={workers} setWorkers={setWorkers} currentUser={currentUser} systemUsers={systemUsers} setSystemUsers={setSystemUsers} />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/invoice" element={<Invoice projects={projects} currentUser={currentUser} />} />
          <Route path="/forms/purchase-request/:refNo?" element={<PurchaseRequest projects={projects} workers={workers} currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="/forms/cash-request/:refNo?" element={<CashRequest projects={projects} workers={workers} currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="/pr-detail/:prId" element={<PRDetailPage currentUser={currentUser} systemUsers={systemUsers} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
