
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  HomeIcon,
  BriefcaseIcon,
  BarChart2Icon,
  MessageSquareIcon,
  CalendarIcon,
  SettingsIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  BotMessageSquare, ArrowsUpFromLine
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
  const { setIsAuthenticated, setEmail, user } = useAuth();
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
    { icon: <BriefcaseIcon />, label: "My Tasks", id: "tasks", route: "/task-swiper" },
    { icon: <BarChart2Icon />, label: "Tasks Board", id: "taskaBoard", route: "/board" },
    { icon: <CalendarIcon />, label: "Projects", id: "projects", route: "/projects" },
    { icon: <ArrowsUpFromLine />, label: "Stages", id: "processes", route: "/stage-management" },
    { icon: <UserIcon />, label: "Employees", id: "employees", route: "/employees" },
    { icon: <BotMessageSquare />, label: "Ai", id: "ai", route: "/history" },
    { icon: <CalendarIcon />, label: "Timeline", id: "timeline", route: "/timeline" },
    { icon: <MessageSquareIcon />, label: "Task Detail", id: "taskDetail", route: "/task-detail" },

    { icon: <UserIcon />, label: "Profile", id: "profile", route: "/profile" },
  ];

  const recentProjects = [
    { name: "Project Alpha", icon: <BriefcaseIcon className="w-4 h-4 text-blue-500" />, route: "/projects/alpha" },
    { name: "Project Beta", icon: <BriefcaseIcon className="w-4 h-4 text-green-500" />, route: "/projects/beta" },
    { name: "Project Gamma", icon: <BriefcaseIcon className="w-4 h-4 text-yellow-500" />, route: "/projects/gamma" },
  ];

  return (
    <TooltipProvider>
      <div
        className={`bg-white dark:bg-gray-900 flex flex-col h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } border-r border-gray-200 dark:border-gray-700 shadow-lg`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} alt="User avatar" />
                <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">{user?.displayName}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
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

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ icon, label, id, route }) => (
            <Tooltip key={id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={route} passHref>
                  <Button
                    variant={pathname === route ? "default" : "ghost"}
                    className={`w-full justify-start text-left text-sm ${
                      isCollapsed ? "px-3 py-2" : "px-4 py-3"
                    } ${
                      pathname === route
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    } rounded-md`}
                  >
                    <span className="flex items-center">
                      {React.cloneElement(icon as React.ReactElement, {
                        className: `w-5 h-5 ${isCollapsed ? "mr-0" : "mr-3"}`,
                      })}
                      {!isCollapsed && <span>{label}</span>}
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

        {/* Recent Projects */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recent Projects</h3>
            <div className="space-y-2">
              {recentProjects.map((project, index) => (
                <Link key={index} href={project.route} passHref>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left text-sm px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="flex items-center">
                      {project.icon}
                      <span className="ml-3">{project.name}</span>
                    </span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-auto p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between ${isCollapsed ? 'flex-col space-y-4' : 'flex-row space-x-4'}`}>
          {/* Theme Toggle */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full bg-gray-100 dark:bg-gray-800"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-gray-700" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Toggle Theme</p>
            </TooltipContent>
          </Tooltip>

          {/* Logout */}
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
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <LogOutIcon className="w-5 h-5 text-red-500" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
