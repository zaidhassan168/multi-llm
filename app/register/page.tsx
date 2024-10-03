"use client";

import { FormEvent, useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signOut, updateProfile, OAuthProvider, signInWithPopup } from "firebase/auth";
import { app, db } from "../../firebase";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { createEmployee, Employee } from "@/models/employee";
import { doc, getDoc } from "firebase/firestore";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      const employeeDocRef = doc(db, "employees", email);
      const employeeSnapshot = await getDoc(employeeDocRef);

      if (employeeSnapshot.exists()) {
        return employeeSnapshot.data() as Employee;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      return null;
    }
  }

  const handleGoToSignin = () => {
    router.push("/login");
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
  
    if (password !== confirmation) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
  
    try {
      // Create the user with Firebase Authentication
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
      const { user } = userCredential;
      console.log("User created:", user);
  
      // Update the user's display name
      await updateProfile(user, { displayName: name });
      console.log("User display name updated:", name);
  
      // Create or update employee record in Firestore
      await createOrUpdateEmployee(user);
  
      // Sign the user out after saving their details to Firestore
      await signOut(auth);
      console.log("User signed out after registration");
  
      // Redirect the user to the login page
      setIsLoading(false);
      router.push("/login");
  
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setIsLoading(true);
    setError("");

    try {
      const auth = getAuth(app);
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("User signed in with Microsoft:", user);

      // Create or update employee record in Firestore
      await createOrUpdateEmployee(user);

      // Sign the user out after saving their details to Firestore
      await signOut(auth);
      console.log("User signed out after registration");

      // Redirect the user to the login page
      setIsLoading(false);
      router.push("/login");
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  }

  async function createOrUpdateEmployee(user: any) {
    const existingEmployee = await getEmployeeByEmail(user.email ?? "");
    let newEmployee: Employee;

    if (existingEmployee) {
      newEmployee = {
        ...existingEmployee,
        id: user.uid,
        name: user.displayName || name,
      };
    } else {
      newEmployee = {
        id: user.uid,
        email: user.email ?? "",
        name: user.displayName || name,
        role: "undefined", // Set default role or role as per your app
      };
    }

    // Save the employee to Firestore
    await createEmployee(newEmployee);
    console.log("Employee data saved to Firestore");
  }
  
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>
            Enter your name, email, password, and confirm password to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                id="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                type="password"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                id="confirmPassword"
                type="password"
                required
              />
            </div>
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : "Register"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
               variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Sign up with Microsoft
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline" prefetch={false}>
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}