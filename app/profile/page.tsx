"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  UserCircle, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Edit,
  Save
} from "lucide-react";
import { fetchEmployee } from "@/models/employee";
import { updateProfile } from "firebase/auth";

type Employee = {
  id: string;
  name: string;
  role: "developer" | "management" | "projectManager" | "undefined";
  availability?: number;
  currentProject?: string;
  email: string;
  projectIds?: string[];
  taskIds?: string[];
  totalTasks?: number;
  completedTasks?: number;
  currentProjectProgress?: number;
  joinDate?: string;
};

function UserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user && user.email) {
      fetchEmployeeData(user.email);
      setNewDisplayName(user.displayName || "");
    }
  }, [user]);

  const fetchEmployeeData = async (email: string) => {
    try {
      const emp = await fetchEmployee(email);
      // Adding mock data for new fields
      const mockData = {
        totalTasks: 45,
        completedTasks: 32,
        currentProjectProgress: 75,
        joinDate: "2022-03-15",
      };
      setEmployee({ ...emp, ...mockData });
    } catch (error) {
      console.error("Failed to fetch employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (user) {
      try {
        await updateProfile(user, { displayName: newDisplayName });
        setEditMode(false);
      } catch (error) {
        console.error("Error updating display name:", error);
      }
    }
  };

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (!user || !employee) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 shadow-lg p-6 rounded-3xl">
        <CardContent>User not logged in or employee not found</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <CardHeader className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
            <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "User"} />
            <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">
            {editMode ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-48 bg-white/20 border-white/40 text-white placeholder-white/60"
                  placeholder="Enter name"
                />
                <Button onClick={handleSaveDisplayName} variant="secondary" size="icon">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {user.displayName || "User Profile"}
                <Button variant="ghost" size="icon" onClick={() => setEditMode(true)} className="text-white hover:bg-white/20">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
          <p className="text-lg font-medium text-blue-100">{employee.role || "Team Member"}</p>
        </CardHeader>
      </div>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <InfoItem icon={<Mail className="text-blue-500" />} label="Email" value={user.email || "N/A"} />
        <InfoItem icon={<Briefcase className="text-green-500" />} label="Current Project" value={employee.currentProject || "N/A"} />
        <InfoItem icon={<Clock className="text-yellow-500" />} label="Availability" value={`${employee.availability || 0}%`} />
        <InfoItem icon={<Calendar className="text-purple-500" />} label="Join Date" value={employee.joinDate || "N/A"} />
        
        <div className="col-span-full">
          <h3 className="text-lg font-semibold mb-2">Task Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaskStatCard 
              icon={<CheckCircle className="text-green-500" />} 
              label="Completed Tasks" 
              value={employee.completedTasks || 0} 
              total={employee.totalTasks || 0}
            />
            <TaskStatCard 
              icon={<AlertCircle className="text-yellow-500" />} 
              label="Pending Tasks" 
              value={(employee.totalTasks || 0) - (employee.completedTasks || 0)} 
              total={employee.totalTasks || 0}
            />
          </div>
        </div>

        <div className="col-span-full">
          <h3 className="text-lg font-semibold mb-2">Current Project Progress</h3>
          <Progress value={employee.currentProjectProgress} className="h-2 mb-2" />
          <p className="text-sm text-gray-600">{employee.currentProjectProgress}% Complete</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TaskStatCard({ icon, label, value, total }: { icon: React.ReactNode; label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <Card className="p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h4 className="font-medium text-gray-700">{label}</h4>
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <Progress value={percentage} className="h-1 mb-1" />
      <p className="text-xs text-gray-500 text-right">{percentage.toFixed(0)}% of total</p>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
        <CardHeader className="flex flex-col items-center space-y-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
          <div className="col-span-full space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="col-span-full space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserProfile;