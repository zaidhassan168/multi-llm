'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './ui/loading-spinner'
import { usePathname, useRouter } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, email, checkAuthState } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuthState()
      setIsLoading(false)
    }
    initAuth()
  }, [checkAuthState])

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <main className="flex-1 flex flex-col min-h-screen overflow-hidden">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={email}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default Layout