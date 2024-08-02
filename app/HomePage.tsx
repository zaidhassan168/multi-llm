// HomePage.tsx
"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import About from '@/components/About'; // Add other components here

interface HomePageProps {
  email?: string;
}

export default function HomePage({ email }: HomePageProps) {
  const [currentComponent, setCurrentComponent] = useState(''); // Add this state variable
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleSidebarClick = (component: string) => {
    setCurrentComponent(component);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        email={email}
        onButtonClick={handleSidebarClick} // Add this prop
      />
<main className="flex-1 flex flex-col min-h-screen overflow-hidden">
{currentComponent === 'chat' && <Chat />}
        {currentComponent === 'about' && <About />} 
        {/* ... your main content */}
      </main>
    </div>
  );
}