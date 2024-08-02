// Sidebar.tsx
"use client";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  HomeIcon,
  LogOutIcon,
  MailIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  email?: string;
  onButtonClick: (component: string) => void; // Add this line
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  email,
  onButtonClick, // Add this line
}: SidebarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await signOut(getAuth(app));
    await fetch("/api/logout");
    setIsLoading(false);
    router.push("/login");
  }

  return (
    <div
      className={`bg-white border-r flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
        }`}
    >
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <Button
          variant="ghost"
          className="hover:bg-transparent"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ArrowRightIcon className="w-4 h-4" />
          ) : (
            <ArrowLeftIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="px-4 py-6 border-b flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="text-gray-800 font-medium">{email}</div>
        )}
      </div>

      <nav className={`flex-1 py-6 px-4 space-y-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        {[
          { icon: <HomeIcon />, label: "Chat" },
          { icon: <UserIcon />, label: "About" },
          { icon: <BriefcaseIcon />, label: "Services" },
          { icon: <MailIcon />, label: "Contact" },
        ].map(({ icon, label }, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`flex items-center gap-3 text-gray-600 hover:text-gray-800 transition w-full ${isCollapsed ? "justify-center" : "justify-start" // Adjust alignment
              }`}
            onClick={() => onButtonClick(label.toLowerCase())} // Add this line
          >
            <div className="flex-shrink-0 w-5 h-5"> {/* Icon wrapper */}
              {icon}
            </div>
            {!isCollapsed && <span>{label}</span>}
          </Button>
        ))}
      </nav>

      <div
        className={`border-t px-4 py-4 space-y-2 ${isCollapsed ? "px-2" : "px-4"
          }`}
      >
        <Button
          className="w-full hover:bg-primary-500 hover:text-primary-foreground transition-colors flex items-center"
          onClick={handleLogout}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <LogOutIcon className="w-5 h-5 flex-shrink-0" />
          )}
          
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
}