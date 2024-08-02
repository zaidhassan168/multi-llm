"use client"

import { useState } from "react"
import Link from "next/link"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase";

import {
  BriefcaseIcon,
  HomeIcon,
  LayersIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MountainIcon,
  XIcon,
} from '@/components/ui/icons'

interface HomePageProps {
  email?: string;
}

export default function HomePage({ email }: HomePageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const router = useRouter();

  async function handleLogout() {
    await signOut(getAuth(app));
    await fetch("/api/logout");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="#" className="flex items-center gap-2" prefetch={false}>
            <span className="font-bold">{email}</span>
          </Link>
        </div>
        <nav className="flex-1 border-t px-4 py-6">
          <ul className="grid gap-2 text-sm font-medium">
            <li>
              <Link
                href="#"
                className="flex items-center gap-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <HomeIcon className="h-5 w-5" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center gap-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <BriefcaseIcon className="h-5 w-5" />
                About
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center gap-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <LayersIcon className="h-5 w-5" />
                Services
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center gap-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
              >
                <MailIcon className="h-5 w-5" />
                Contact
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
              >
                <LogOutIcon className="h-5 w-5" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <main className="flex-1 py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  The complete platform for building the Web
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable.
                  Open Source.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <img
                src="/placeholder.svg"
                width="550"
                height="550"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-bottom sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
