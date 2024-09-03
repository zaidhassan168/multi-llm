// Layout.tsx
'use client'
import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  email?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, email }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={email}
        isCollapsed={isSidebarCollapsed}
        onCollapseToggle={handleCollapseToggle}
      />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
