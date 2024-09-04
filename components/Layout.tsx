'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, email } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (!isAuthenticated) {
    return <main className="flex-1 flex flex-col min-h-screen overflow-hidden">{children}</main>;
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
  );
};

export default Layout;