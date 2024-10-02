"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  HomeIcon,
  LayoutDashboardIcon,
  CheckSquareIcon,
  FolderIcon,
  UsersIcon,
  BrainCircuitIcon,
  CalendarIcon,
  MessageSquareIcon,
  UserIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  BarChart2Icon,
  ArrowsUpFromLineIcon,
  PanelsTopLeftIcon,
} from "lucide-react"
import { getAuth, signOut } from "firebase/auth"
import { app } from "../firebase"
import { useRouter } from "next/navigation"
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from 'next-themes'
import { NotificationPanel } from './NotificationPanel'
interface SidebarProps {
  email: string | null
}

export default function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setIsAuthenticated, setEmail, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut(getAuth(app))
      await fetch("/api/logout")
      setIsAuthenticated(false)
      setEmail(null)
      router.push('/login')
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const navItems = [
    { icon: LayoutDashboardIcon, label: "Dashboard", route: "/dashboard" },
    { icon: CheckSquareIcon, label: "My Tasks", route: "/task-swiper" },
    { icon: BarChart2Icon, label: "Tasks Board", route: "/board" },
    { icon: FolderIcon, label: "Projects", route: "/projects" },
    { icon: ArrowsUpFromLineIcon, label: "Stages", route: "/stage-management" },
    { icon: UsersIcon, label: "Employees", route: "/employees" },
    { icon: BrainCircuitIcon, label: "AI Assistant", route: "/history" },
    { icon: CalendarIcon, label: "Timeline", route: "/timeline" },
    { icon: MessageSquareIcon, label: "Task Detail", route: "/task-detail" },
    { icon: UserIcon, label: "Profile", route: "/profile" },
  ]

  return (
    <TooltipProvider>
      <aside className={`flex flex-col h-screen bg-background dark:bg-background border-r border-border transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <HomeIcon className="w-8 h-8 text-primary dark:text-primary" />
              <span className="text-xl font-bold text-foreground dark:text-foreground">elTrack</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full hover:bg-secondary dark:hover:bg-secondary"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelsTopLeftIcon className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <ScrollArea className="flex-grow px-3 py-2">
          <nav className="space-y-1">
            {navItems.map(({ icon: Icon, label, route }) => (
              <Tooltip key={route} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link href={route} passHref>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${isCollapsed ? "px-3" : "px-4"} py-2 ${
                        pathname === route
                          ? "bg-primary-muted text-primary dark:bg-primary dark:text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary dark:hover:bg-secondary"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
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
        </ScrollArea>

        <Separator className="my-2" />

        <div className="p-4 space-y-4">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && <span className="text-sm font-medium text-muted-foreground">Dark Mode</span>}
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Switch>
          </div>
          <NotificationPanel />
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start ${isCollapsed ? "px-3" : "px-4"} py-2 text-destructive hover:bg-destructive/10`}
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOutIcon className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
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

        <Separator className="my-2" />

        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} alt="User avatar" />
            <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{user?.displayName}</span>
              <span className="text-xs text-muted-foreground">{email}</span>
              {/* <span className="text-xs text-primary capitalize">{user?.role || "User"}</span> */}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}