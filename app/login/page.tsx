"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../../firebase";
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    setIsLoading(true);
    event.preventDefault();
    setError("");

    try {
      const credential = await signInWithEmailAndPassword(
        getAuth(app),
        email,
        password
      );
      const idToken = await credential.user.getIdToken();

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      setIsLoading(false);
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form 
           onSubmit={handleSubmit}
           action="#"
          className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
              onChange={(e) => setEmail(e.target.value)}
               id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm underline" prefetch={false}>
                  Forgot password?
                </Link>
              </div>
              <Input 
              onChange={(e) => setPassword(e.target.value)}
              id="password" type="password" required />
            </div>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <Button disabled={isLoading}
           
               type="submit" className="w-full">
               {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Do not have an account?{" "}
          <Link href="/register" className="underline" prefetch={false}>
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
