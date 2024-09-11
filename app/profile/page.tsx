"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Edit,
  Save,
  Camera,
} from "lucide-react";
import { fetchEmployee } from "@/models/employee";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  const [imageUrl, setImageUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.email) {
      fetchEmployeeData(user.email);
      setNewDisplayName(user.displayName || "");
    }
  }, [user]);

  const fetchEmployeeData = async (email: string) => {
    try {
      const emp = await fetchEmployee(email);
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const storage = getStorage();
      const storageRef = ref(storage, `images/${file.name}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progressPercent);
        },
        (error) => {
          console.error('Error uploading file:', error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageUrl(downloadURL);
          });
        }
      );
    }
  }

  const handleImageSave = async () => {
    if (user) {
      try {
        await updateProfile(user, { photoURL: imageUrl });
        setProgress(0);
        setImageUrl('');
      } catch (error) {
        console.error("Error updating profile:", error);
      }
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (!user || !employee) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-600">User not logged in or employee not found</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
              <AvatarImage
                src={user.photoURL || "/placeholder.svg"}
                alt={user.displayName || "User"}
              />
              <AvatarFallback>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              size="icon"
            >
              <Camera className="h-5 w-5 text-blue-600" />
            </Button>
          </div>
          <div className="text-center">
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
                <h1 className="text-3xl font-bold">{user.displayName || "User Profile"}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditMode(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-sm mt-2 text-white/80">{employee.role}</p>
          </div>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        aria-label="Upload new profile picture"
      />

      {progress > 0 && progress < 100 && (
        <div className="p-4 bg-blue-50">
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-blue-600">{progress}% Complete</p>
        </div>
      )}

      {imageUrl && progress === 100 && (
        <div className="p-4 bg-green-50 flex justify-between items-center">
          <p className="text-sm text-green-600">Image uploaded successfully!</p>
          <Button onClick={handleImageSave} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
            Save Profile Image
          </Button>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoItem icon={<Mail className="text-blue-500" />} label="Email" value={user.email || "N/A"} />
        <InfoItem icon={<Briefcase className="text-green-500" />} label="Current Project" value={employee.currentProject || "N/A"} />
        <InfoItem icon={<Clock className="text-yellow-500" />} label="Availability" value={`${employee.availability || 0}%`} />
        <InfoItem icon={<Calendar className="text-purple-500" />} label="Join Date" value={employee.joinDate || "N/A"} />

        <div className="col-span-full mt-6">
          <h3 className="text-lg font-semibold mb-4">Task Overview</h3>
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

        <div className="col-span-full mt-6">
          <h3 className="text-lg font-semibold mb-2">Current Project Progress</h3>
          <Progress value={employee.currentProjectProgress} className="h-2 mb-2" />
          <p className="text-sm text-gray-600">{employee.currentProjectProgress}% Complete</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h4 className="font-medium text-gray-700">{label}</h4>
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <Progress value={percentage} className="h-1 mb-1" />
      <p className="text-xs text-gray-500 text-right">{percentage.toFixed(0)}% of total</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
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
      </div>
    </div>
  );
}

export default UserProfile;