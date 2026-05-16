import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ id: 'usr-admin', name: 'Admin', role: 'Admin', initials: 'AD' });

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
      const handler = setTimeout(() => {
        setDoc(doc(db, 'appState', 'main'), { projects, workers, currentUser, systemUsers }, { merge: true }).catch(console.error);
      }, 2000); // Wait for 2 seconds of inactivity before saving
      
      return () => clearTimeout(handler);
    }
  }, [projects, workers, currentUser, systemUsers, dataLoaded, firebaseError]);

  return (
    <DataContext.Provider value={{
      projects, setProjects,
      workers, setWorkers,
      systemUsers, setSystemUsers,
      currentUser, setCurrentUser,
      dataLoaded, firebaseError, setFirebaseError
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
