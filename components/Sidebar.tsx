import React, { useState } from "react";
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
  onButtonClick: (component: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  email,
  onButtonClick,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    { icon: <HomeIcon className="w-5 h-5" />, label: "Chat" },
    { icon: <UserIcon className="w-5 h-5" />, label: "About" },
    { icon: <BriefcaseIcon className="w-5 h-5" />, label: "Profile" },
    { icon: <MailIcon className="w-5 h-5" />, label: "Gemini" },
    { icon: <MailIcon className="w-5 h-5" />, label: "Code" },
  ];

  return (
    <div
      className={`bg-white border-r flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!isCollapsed && <h1 className="text-xl font-bold text-gray-800">Menu</h1>}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ArrowRightIcon className="w-5 h-5" />
          ) : (
            <ArrowLeftIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="p-4 border-b flex items-center gap-3">
        <Avatar className="w-10 h-10">
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
        {navItems.map(({ icon, label }, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`w-full flex items-center gap-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors ${
              isCollapsed ? "justify-center px-2" : "justify-start px-4"
            }`}
            onClick={() => onButtonClick(label.toLowerCase())}
          >
            <div className="flex-shrink-0">{icon}</div>
            {!isCollapsed && <span>{label}</span>}
          </Button>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t">
        <Button
          className="w-full hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
};

export default Sidebar;