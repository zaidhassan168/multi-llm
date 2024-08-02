"use client";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  HomeIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  XIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";

interface HomePageProps {
  email?: string;
}

export default function HomePage({ email }: HomePageProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await signOut(getAuth(app));
    await fetch("/api/logout");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <div
        className={`bg-white border-r flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
          }`}
      >
        <div className="px-2 py-2 border-b flex items-center justify-between">
          <Button
            className="transition-colors bg-transparent hover:bg-transparent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ArrowRightIcon className="w-4 h-4" />
            ) : (
              <ArrowLeftIcon className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="px-4 py-6 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div
              className={`text-gray-800 font-medium transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
            >
              {email}
            </div>
          </div>
        </div>
        <nav
          className={`flex-1 py-6 px-4 space-y-4 transition-all duration-300 ${isCollapsed ? "px-2" : "px-4"
            }`}
        >
          <Button
            variant="ghost"
            className={`flex items-center gap-3 text-gray-600 hover:text-gray-800 transition ${isCollapsed ? "justify-center" : "justify-start"
              }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span
              className={`transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
            >
              Home
            </span>
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-3 text-gray-600 hover:text-gray-800 transition ${isCollapsed ? "justify-center" : "justify-start"
              }`}
          >
            <UserIcon className="w-5 h-5" />
            <span
              className={`transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
            >
              About
            </span>
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-3 text-gray-600 hover:text-gray-800 transition ${isCollapsed ? "justify-center" : "justify-start"
              }`}
          >
            <BriefcaseIcon className="w-5 h-5" />
            <span
              className={`transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
            >
              Services
            </span>
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-3 text-gray-600 hover:text-gray-800 transition ${isCollapsed ? "justify-center" : "justify-start"
              }`}
          >
            <MailIcon className="w-5 h-5" />
            <span
              className={`transition-all duration-300 ${isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
            >
              Contact
            </span>
          </Button>
        </nav>
        <div
  className={`border-t px-4 py-4 space-y-2 transition-all duration-300 ${isCollapsed ? "px-2" : "px-4"}`}
>
  <Button
    className="w-full hover:bg-primary-500 hover:text-primary-foreground transition-colors flex items-center"
    onClick={handleLogout}
  >
    <LogOutIcon className="w-5 h-5 flex-shrink-0" />
    <span
      className={`ml-2 transition-all duration-300 ${isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"}`}
    >
      Logout
    </span>
  </Button>
</div>


      </div>
      <main className="flex-1 p-8" />
    </div>
  );
}
