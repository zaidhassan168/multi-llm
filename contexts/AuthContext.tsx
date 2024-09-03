'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase';

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  setIsAuthenticated: (value: boolean) => void;
  setEmail: (value: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  email: null,
  setIsAuthenticated: () => {},
  setEmail: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setEmail(user ? user.email : null);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, setIsAuthenticated, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
};