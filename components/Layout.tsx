'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './ui/loading-spinner'
import { usePathname, useRouter } from 'next/navigation'
import { ScrollArea } from './ui/scroll-area'
import { EmployeeProfileDropdown } from './employee-dropdown'
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
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
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
      {/* Sidebar with fixed height and non-scrollable */}
      <div className="h-screen sticky top-0">
        <Sidebar
          email={email || ''}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
      </div>
      
      {/* Main content area with scroll */}
      <ScrollArea className="flex-1 h-screen overflow-auto">
        <main className="flex-1 flex flex-col min-h-screen">
          {children}
        </main>
      </ScrollArea>
    </div>
  )
}
export default Layout