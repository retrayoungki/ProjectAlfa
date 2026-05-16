import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('alfa_authenticated') === 'true';
  });

  const login = () => {
    setAuthenticated(true);
    sessionStorage.setItem('alfa_authenticated', 'true');
  };

  const logout = () => {
    setAuthenticated(false);
    sessionStorage.removeItem('alfa_authenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
