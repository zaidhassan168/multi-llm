// HomePage.tsx
"use client";
import { useState } from 'react';

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
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
      </main>
    </div>
  );
}