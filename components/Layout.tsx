'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './ui/loading-spinner'
import { usePathname, useRouter } from 'next/navigation'
import { ScrollArea } from './ui/scroll-area'
import { EmployeeProfileDropdown } from './employee-dropdown'
import LottieLoading from './LottieLoading'
interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, email, checkAuthState } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Define routes where Sidebar should be excluded
  const excludedRoutes = ['/login', '/register']

  useEffect(() => {
    const initAuth = async () => {
      await checkAuthState()
      setIsLoading(false)
    }
    initAuth()
  }, [checkAuthState])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !excludedRoutes.includes(pathname)) {
        router.push('/login')
      } else if (isAuthenticated && excludedRoutes.includes(pathname)) {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LottieLoading size="large" />
      </div>
    )
  }

  // Determine if Sidebar should be shown
  const shouldShowSidebar = isAuthenticated && !excludedRoutes.includes(pathname)

  return (
    <div className="flex min-h-screen">
      {/* Conditionally render Sidebar */}
      {shouldShowSidebar && (
        <div className="h-screen sticky top-0">
          <Sidebar
            email={email || ''}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        </div>
      )}
      
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
