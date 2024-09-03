"use client";

import React from "react";
import { useAuth } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, UserRound, UserCircleIcon } from "lucide-react";

function UserData() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <Card className="w-full max-w-md mx-auto"><CardContent>User not logged in</CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center space-y-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.photoURL || "/placeholder.svg?height=96&width=96"} alt={user.displayName || "User"} />
          <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-bold">{user.displayName || "User Profile"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <UserRound className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="font-medium">{user.uid}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Mail className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <UserCircleIcon className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Display Name</p>
            <p className="font-medium">{user.displayName || "Not set"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserProfile() {
  return <UserData />;
}

function LoadingSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-8 w-[200px]" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="w-6 h-6 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}