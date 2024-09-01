"use client";

import { FormEvent, useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app,db } from "../../firebase";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { createEmployee, Employee } from '@/models/employee';
import { doc, collection, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading ] = useState(false);
  const router = useRouter();

  async function getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      // Reference the document in the 'employees' collection with the email as the document ID
      const employeeDocRef = doc(db, 'employees', email);
      
      // Fetch the document
      const employeeSnapshot = await getDoc(employeeDocRef);
      
      // Check if the document exists and return the data
      if (employeeSnapshot.exists()) {
        return employeeSnapshot.data() as Employee;
      } else {
        console.log('No such employee!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }
         
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
      const userCredential = await createUserWithEmailAndPassword(getAuth(app), email, password);
      console.log("User created:", userCredential.user);
      // After successful signup, create the employee
      let newEmployee: Employee
      const existingEmployee = await getEmployeeByEmail(userCredential.user.email ?? "")
      console.log("Existing Employee:", existingEmployee);
      if (existingEmployee) {
        newEmployee = {
          ...existingEmployee,
          id: userCredential.user.uid,
        }
      } else {
        newEmployee = {
          id: userCredential.user.uid,
          email: userCredential.user.email ?? "",
          name: "",
          role: "undefined",
        }
      }
        // Add other fields as need
      await createEmployee(newEmployee); // Call the createEmployee API
  
      setIsLoading(false);
      router.push("/login");
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  }
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Enter your email, password, and confirm password to create an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
               id="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
               id="confirmPassword" type="password" required />
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
          Already have an account?{" "}
          <Link href="#" className="underline" prefetch={false}>
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
