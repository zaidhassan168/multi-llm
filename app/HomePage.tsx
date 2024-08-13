// HomePage.tsx
"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import DatabaseChat from '@/components/DatabaseChat';
import UserProfile from '@/components/UserProfile';
import GeminiChat from '@/components/GeminiChat';
import CodeChat from '@/components/CodeChat';
import Assistant from '@/components/assistant';
interface HomePageProps {
  email?: string;
}

export default function HomePage({ email }: HomePageProps) {
  const [currentComponent, setCurrentComponent] = useState(''); // Add this state variable
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChat, setShowChat] = useState(true);

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
        {currentComponent === 'about' && <DatabaseChat />}
        {currentComponent === 'profile' && <UserProfile />}
        {currentComponent === 'gemini' && <GeminiChat />}
        {currentComponent === 'code' && <CodeChat />}
        {currentComponent === 'assistant' && <Assistant />}
        {/* ... your main content */}
      </main>
    </div>
  );
}