// components/employee-profile-dropdown.tsx
"use client"

import React, { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Edit,
  LogOut,
  Camera,
  Save,
} from "lucide-react"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { 
  Employee, 
  fetchEmployee, 
  updateEmployee, 
  updateEmployeeStreak, 
   
} from "@/models/employee"
import {fetchTasksEmail, Task, updateTask } from "@/models/task"


export function EmployeeProfileDropdown({ email}: { email: string}) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [tasksToUpdate, setTasksToUpdate] = useState<Task[]>([])
  const [newName, setNewName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    fetchEmployeeData(email)
    if (employee?.role) {
      fetchTasksEmail(email, employee.role).then(tasks => {
        const needsUpdate = tasks.filter(
          task => task.status !== "done" &&
          (!task.lastUpdated || new Date(task.lastUpdated).toDateString() !== new Date().toDateString())
        )
        setTasksToUpdate(needsUpdate)
      })
    }
  }, [email, employee?.role])

  const fetchEmployeeData = async (email: string) => {
    try {
      const emp = await fetchEmployee(email)
      setEmployee(emp)
      setNewName(emp.name)
    } catch (error) {
      console.error("Failed to fetch employee:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const storage = getStorage()
      const storageRef = ref(storage, `images/${file.name}`)

      const uploadTask = uploadBytesResumable(storageRef, file)

      setIsUploadingImage(true)
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progressPercent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          )
          setProgress(progressPercent)
        },
        (error) => {
          console.error("Error uploading file:", error)
          setIsUploadingImage(false)
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageUrl(downloadURL)
            setIsUploadingImage(false)
          })
        }
      )
    }
  }

  const handleImageSave = async () => {
    if (employee && imageUrl) {
      try {
        const updatedEmployee = await updateEmployee({ ...employee, photoURL: imageUrl })
        setEmployee(updatedEmployee)
        setProgress(0)
        setImageUrl("")
      } catch (error) {
        console.error("Error updating profile:", error)
      }
    }
  }

  const handleSaveName = async () => {
    if (employee && newName) {
      try {
        const updatedEmployee = await updateEmployee({ ...employee, name: newName })
        setEmployee(updatedEmployee)
        setIsEditingName(false)
      } catch (error) {
        console.error("Error updating name:", error)
      }
    }
  }

  const handleQuickUpdate = async (task: Task, status: string) => {
    if (employee) {
      try {
        await updateTask(task, employee.email)
        setTasksToUpdate((prev) => prev.filter((taskTemp) => taskTemp.id !== task.id))

        if (tasksToUpdate.length === 1) {
          // This was the last task, update the streak
          const newStreak = await updateEmployeeStreak(employee.email)
          setEmployee((prev) => prev ? { ...prev, streak: newStreak } : null)
        }
      } catch (error) {
        console.error("Error updating task:", error)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!employee) {
    return <Skeleton className="w-8 h-8 rounded-full" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.photoURL || undefined} alt={employee.name} />
            <AvatarFallback>
              {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{employee.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{employee.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Make changes to your profile here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={employee.photoURL || undefined} />
                    <AvatarFallback>
                      {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button onClick={triggerFileInput} disabled={isUploadingImage}>
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
                {progress > 0 && progress < 100 && (
                  <Progress value={progress} className="w-full" />
                )}
                {imageUrl && (
                  <Button onClick={handleImageSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save New Photo
                  </Button>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <Button onClick={handleSaveName}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{employee.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                Developer Stats
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Developer Stats</DialogTitle>
                <DialogDescription>Your current development statistics.</DialogDescription>
              </DialogHeader>
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center">
                    <Trophy className="text-yellow-500 mr-2 h-4 w-4" />
                    <span className="font-semibold">Streak: {employee.streak || 0} days</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="text-blue-500 mr-2 h-4 w-4" />
                    <span className="font-semibold">Points: {employee.points || 0}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Level Progress</span>
                      <span className="text-sm font-medium">{employee.levelProgress || 0}%</span>
                    </div>
                    <Progress value={employee.levelProgress || 0} className="w-full" />
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="text-green-500 mr-2 h-4 w-4" />
                    <span className="font-semibold">Tasks This Week: {employee.tasksCompletedThisWeek || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="text-purple-500 mr-2 h-4 w-4" />
                    <span className="font-semibold">Rank: {employee.rank || 'Novice'}</span>
                  </div>
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Daily Updates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Daily Task Updates</DialogTitle>
                <DialogDescription>Update your tasks to maintain your streak.</DialogDescription>
              </DialogHeader>
              {tasksToUpdate.length > 0 ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {tasksToUpdate.map((task) => (
                        <div key={task.id} className="flex items-center justify-between">
                          <span>{task.title}</span>
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-2"
                              onClick={() => handleQuickUpdate(task, "inProgress")}
                            >
                              In Progress
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickUpdate(task, "done")}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p>No tasks to update today. Great job!</p>
              )}
            </DialogContent>
          </Dialog>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-start" >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}