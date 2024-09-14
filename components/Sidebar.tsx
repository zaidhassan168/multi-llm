import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  HomeIcon,
  BriefcaseIcon,
  CodeIcon,
  BotIcon,
  HistoryIcon,
  KanbanIcon,
  BookDashedIcon,
  MailIcon,
  BellIcon,
  MessageCircleIcon,
  InboxIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  SquareChartGantt
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";
import { useRouter } from "next/navigation";
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';

interface SidebarProps {
  email: string | null;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ email, isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setIsAuthenticated, setEmail,user  } = useAuth();
  const { theme, setTheme } = useTheme();

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
    { icon: <HomeIcon />, label: "Dashboard", id: "dashboard", route: "/dashboard" },
    { icon: <BriefcaseIcon />, label: "My Tasks", id: "tasks", route: "/task-swiper"},
    // { icon: <BellIcon />, label: "Notifications", id: "notifications", route: "/notifications", count: 4 },
    // { icon: <MessageCircleIcon />, label: "Messages", id: "messages", route: "/messages" },
    // { icon: <InboxIcon />, label: "Inbox", id: "inbox", route: "/inbox", count: 9 },
    { icon: <img src="/assets/openai.svg" alt="OpenAI" className="w-5 h-5" />, label: "OpenAI", id: "openai", route: "/openai" },
    { icon: <img src="/assets/gemini.svg" alt="Gemini" className="w-5 h-5" />, label: "Gemini", id: "gemini", route: "/gemini" },
    // { icon: <CodeIcon />, label: "Code", id: "code", route: "/code-chat" },
    { icon: <BotIcon />, label: "Assistant", id: "assistant", route: "/assistant" },
    { icon: <HistoryIcon />, label: "History", id: "history", route: "/history" },
    { icon: <img src="/assets/kanban.png" className="w-5 h-5" alt="kanban" />, label: "Board", id: "board", route: "/board" },
    { icon: <BookDashedIcon />, label: "Employees", id: "employees", route: "/employees" },
    { icon: <SquareChartGantt />      , label: "Stages", id: "stages", route: "/stage-management" },
    { icon: <UsersIcon />, label: "Profile", id: "profiles", route: "/profile" },
  ];

  const teamMembers = [
    { name: "Peter Taylor", avatar: "/placeholder-user.jpg", status: "online" },
    { name: "Luvleen Lawrence", avatar: "/placeholder-user.jpg", status: "offline" },
    { name: "Su Hua", avatar: "/placeholder-user.jpg", status: "away" },
  ];

  return (
    <TooltipProvider>
      <div
        className={`bg-white dark:bg-gray-900 flex flex-col h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
                <AvatarFallback>Z</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold">{user?.displayName}</h2>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="rounded-full bg-gray-100 dark:bg-gray-800"
          >
            {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="px-4 mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map(({ icon, label, id, route}) => (
            <Tooltip key={id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={route} passHref>
                  <Button
                    variant={pathname === route ? "default" : "ghost"}
                    className={`w-full justify-start text-left ${
                      isCollapsed ? "px-2" : "px-4"
                    } ${
                      pathname === route
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="flex items-center">
                      {React.cloneElement(icon as React.ReactElement, {
                        className: `w-5 h-5 ${isCollapsed ? "mr-0" : "mr-3"}`,
                      })}
                      {!isCollapsed && (
                        <>
                          <span className="flex-grow">{label}</span>
                        </>
                      )}
                    </span>
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

        {!isCollapsed && (
          <div className="px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex justify-between items-center">
              Teams
              <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                View all
              </Button>
            </h3>
            <div className="mt-2 space-y-2">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar} alt={`${member.name}'s avatar`} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">{member.name}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`mt-auto p-4 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'flex flex-col items-center space-y-4' : 'flex items-center justify-between'}`}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full bg-gray-100 dark:bg-gray-800"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full bg-gray-100 dark:bg-gray-800 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <LogOutIcon className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}