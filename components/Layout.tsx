'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { ScrollArea } from './ui/scroll-area'
import { EmployeeProfileDropdown } from './employee-dropdown'
import LottieLoading from './LottieLoading'
import { NotificationPanel } from './NotificationPanel'
import { BookOpen } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
    <div className="flex min-h-screen bg-background">
      {/* Conditionally render Sidebar */}
      {shouldShowSidebar && (
        <div className="h-screen sticky top-0">
          <Sidebar email={email || ''} />
        </div>
      )}
      
      {/* Main content area with scroll */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {shouldShowSidebar && (
          <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 h-16 px-6 flex items-center justify-between sticky top-0 z-10 transition-all duration-200">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-xl font-semibold text-foreground/90">elTrack</span>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationPanel />
            </div>
          </header>
        )}

        {/* Scrollable content area */}
        <ScrollArea className="flex-1">
          <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}

export default Layout