// app/ClientLayout.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/hooks';  // Import your useAuth hook

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading } = useAuth();  // Get user and loading state from useAuth

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Don't render the layout until loading is complete
  if (loading) {
    return <div>Loading...</div>;
  }

  // Render Sidebar only if user is logged in
  return (
    <div className="flex min-h-screen">
      {user && (
        <Sidebar 
          email={user.email || ''} 
          isCollapsed={isCollapsed} 
          onCollapseToggle={handleCollapseToggle} 
        />
      )}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}
