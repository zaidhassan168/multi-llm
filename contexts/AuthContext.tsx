'use client';
import React, { createContext, useState, useContext, useEffect } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { app } from '../firebase'

interface AuthContextType {
  isAuthenticated: boolean
  email: string | null
  setIsAuthenticated: (value: boolean) => void
  setEmail: (value: string | null) => void
  checkAuthState: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const checkAuthState = async () => {
    return new Promise<void>((resolve) => {
      const auth = getAuth(app)
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsAuthenticated(true)
          setEmail(user.email)
        } else {
          setIsAuthenticated(false)
          setEmail(null)
        }
        resolve()
      })
    })
  }

  useEffect(() => {
    checkAuthState()
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, setIsAuthenticated, setEmail, checkAuthState }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}