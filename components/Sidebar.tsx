'use client'

import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BriefcaseIcon,
  HomeIcon,
  LogOutIcon,
  MailIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  CodeIcon,
  BotIcon,
  HistoryIcon,
  KanbanIcon,
  BookDashedIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  email?: string;
  onButtonClick: (component: string) => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  email,
  onButtonClick,
}: SidebarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeItem, setActiveItem] = useState("chat");

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(getAuth(app));
      await fetch("/api/logout");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [

    { icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard", id: "dashboard" },
    { icon: <UserIcon className="w-5 h-5" />, label: "About", id: "about" },
    { icon: <BriefcaseIcon className="w-5 h-5" />, label: "Profile", id: "profile" },
    { icon: <MessageSquareIcon className="w-5 h-5" />, label: "Gemini", id: "gemini" },
    { icon: <CodeIcon className="w-5 h-5" />, label: "Code", id: "code" },
    { icon: <BotIcon className="w-5 h-5" />, label: "Assistant", id: "assistant" },
    { icon: <HistoryIcon className="w-5 h-5" />, label: "History", id: "history" },
    { icon: <KanbanIcon className="w-5 h-5" />, label: "Kanban", id: "kanban" },
  ];

  return (
    <TooltipProvider>
      <div
        className={`bg-gradient-to-b from-gray-50 to-white border-r flex flex-col h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b">
          {!isCollapsed && <h1 className="text-xl font-bold text-gray-800">Menu</h1>}
          <Button
            variant="ghost"
            size="icon"
            className={`ml-auto transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            onClick={onToggleCollapse}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 border-b flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary ring-offset-2">
            <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">{email}</span>
              <span className="text-xs text-gray-500">User</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map(({ icon, label, id }) => (
            <Tooltip key={id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeItem === id ? "default" : "ghost"}
                  className={`w-full flex items-center gap-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all ${
                    isCollapsed ? "justify-center px-2" : "justify-start px-4"
                  } ${activeItem === id ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}`}
                  onClick={() => {
                    setActiveItem(id);
                    onButtonClick(id);
                  }}
                >
                  <div className="flex-shrink-0">{icon}</div>
                  {!isCollapsed && <span>{label}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                className={`w-full  hover:bg-red-100 transition-all flex items-center justify-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <LogOutIcon className="w-5 h-5 flex-shrink-0" />
                )}
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}