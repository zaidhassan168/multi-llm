import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";
import { useRouter } from "next/navigation";
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  email: string | null;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ email, isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setIsAuthenticated, setEmail } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(getAuth(app));
      await fetch("/api/logout");
      setIsAuthenticated(false);
      setEmail(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard", id: "dashboard", route: "/dashboard" },
    { icon: <img src="/assets/openai.svg" alt="OpenAI" className="w-5 h-5" />, label: "OpenAi", id: "openai", route: "/openai" },
    { icon: <BriefcaseIcon className="w-5 h-5" />, label: "Profile", id: "profile", route: "/profile" },
    { icon: <img src="/assets/gemini.svg" alt="Gemini" className="w-5 h-5" />, label: "Gemini", id: "gemini", route: "/gemini" },
    { icon: <CodeIcon className="w-5 h-5" />, label: "Code", id: "code", route: "/code-chat" },
    { icon: <BotIcon className="w-5 h-5" />, label: "Assistant", id: "assistant", route: "/assistant" },
    { icon: <HistoryIcon className="w-5 h-5" />, label: "History", id: "history", route: "/history" },
    { icon: <img src="/assets/kanban.png" className="w-5 h-5" alt="kanban" />, label: "Kanban", id: "kanban", route: "/kanban" },
    { icon: <BookDashedIcon className="w-5 h-5" />, label: "Employees", id: "employees", route: "/employees" },
    { icon: <MailIcon className="w-5 h-5" />, label: "Tasks", id: "tasks", route: "/task-swiper" },
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
            onClick={toggleSidebar}
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
          {navItems.map(({ icon, label, id, route }) => (
            <Tooltip key={id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={route} passHref>
                  <Button
                    variant={pathname === route ? "default" : "ghost"}
                    className={`w-full flex items-center gap-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all ${
                      isCollapsed ? "justify-center px-2" : "justify-start px-4"
                    } ${pathname === route ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}`}
                  >
                    <div className="flex-shrink-0">{icon}</div>
                    {!isCollapsed && <span>{label}</span>}
                  </Button>
                </Link>
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
                  <svg className="animate-spin h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
