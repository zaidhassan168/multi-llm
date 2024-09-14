// components/UserProfile.tsx

"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Leaderboard from "@/components/leader-board"
import {
  Camera,
  Edit2,
  Save,
  Briefcase,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trophy,
  Star,
  TrendingUp,
  Award,
  Target,
  Zap,
  Mail,
  User,
  Award as AwardIcon,
} from "lucide-react"
import { fetchEmployee, updateEmployee, Employee, triggerAsyncStatsUpdate } from "@/models/employee"
import { fetchTasksEmail, updateTask, Task } from "@/models/task"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { TaskStatCard, AchievementCard, IncentiveCard } from "@/components/tasks/incentive-cards"
function UserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && user.email) {
      fetchEmployeeData(user.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchEmployeeData = async (email: string) => {
    try {
      const emp = await fetchEmployee(email)
      setEmployee(emp)
      setNewName(emp.name)

      // Fetch tasks after employee data is available
      fetchTasksData(email, emp.role)

      // Trigger async stats update
      triggerAsyncStatsUpdate(emp.id, email)
    } catch (error) {
      console.error("Failed to fetch employee:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasksData = async (email: string, role: string) => {
    try {
      const fetchedTasks = await fetchTasksEmail(email, role)
      setTasks(fetchedTasks)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const storage = getStorage()
      const storageRef = ref(storage, `images/${file.name}`)

      const uploadTask = uploadBytesResumable(storageRef, file)

      setIsUploading(true)
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          )
          setProgress(progressPercent)
        },
        (error) => {
          console.error('Error uploading file:', error)
          setIsUploading(false)
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageUrl(downloadURL)
            setIsUploading(false)
          })
        }
      )
    }
  }

  const handleImageSave = async () => {
    if (employee && imageUrl) {
      setIsUploading(true)
      try {
        const updatedEmployee = await updateEmployee({ ...employee, photoURL: imageUrl })
        setEmployee(updatedEmployee)
        setProgress(0)
        setImageUrl("")
      } catch (error) {
        console.error("Error updating profile:", error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleSaveName = async () => {
    if (employee && newName) {
      setIsUpdatingName(true)
      try {
        const updatedEmployee = await updateEmployee({ ...employee, name: newName })
        setEmployee(updatedEmployee)
        setEditMode(false)
      } catch (error) {
        console.error("Error updating name:", error)
      } finally {
        setIsUpdatingName(false)
      }
    }
  }

  const handleTaskUpdate = async (taskId: string, status: string) => {
    if (employee) {
      try {
        await updateTask({ id: taskId, status } as Task, employee.email)
        await fetchTasksData(employee.email, employee.role || 'developer')
        console.log("Task updated successfully")
        // Trigger async stats update
        triggerAsyncStatsUpdate(employee.id, employee.email)
      } catch (error) {
        console.error("Error updating task:", error)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (authLoading || loading) {
    return <LoadingSkeleton />
  }

  if (!user || !employee) {
    return <div className="text-center p-4">User not logged in or employee not found</div>
  }

  const completedTasks = tasks.filter(task => task.status === 'done').length
  const totalTasks = tasks.length
  const pendingTasks = totalTasks - completedTasks

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={employee.photoURL || "/placeholder.svg"} alt={employee.name} />
                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 rounded-full p-1"
                size="icon"
                variant="ghost"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 text-center md:text-left">
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button onClick={handleSaveName} size="icon" variant="ghost" disabled={isUpdatingName}>
                    {isUpdatingName ? <Skeleton className="h-4 w-4 rounded-full" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-2xl font-bold">{employee.name}</CardTitle>
                  <Button
                    onClick={() => setEditMode(true)}
                    size="icon"
                    variant="ghost"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-muted-foreground">{employee.email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {employee.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          {isUploading && (
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">{progress}% Complete</p>
            </div>
          )}
          {imageUrl && (
            <Button onClick={handleImageSave} className="mb-4" variant="outline" disabled={isUploading}>
              {isUploading ? <Skeleton className="h-4 w-4 rounded-full" /> : "Save New Profile Picture"}
            </Button>
          )}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>

            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <InfoItem icon={<Mail />} label="Email" value={employee.email} />
                <InfoItem icon={<User />} label="Role" value={capitalize(employee.role)} />
                <InfoItem icon={<Briefcase />} label="Current Project" value={employee.currentProject || "N/A"} />
                <InfoItem icon={<Clock />} label="Availability" value={`${employee.availability || 0}%`} />
                <InfoItem icon={<Calendar />} label="Join Date" value={employee.lastStatsUpdate ? new Date(employee.lastStatsUpdate).toLocaleDateString() : "N/A"} />
                <InfoItem icon={<Target />} label="Points" value={employee.points?.toString() || "0"} />
                <InfoItem icon={<Trophy />} label="Task Streak" value={`${employee.streak || 0} days`} />
                <InfoItem icon={<Zap />} label="Active Project Streak" value={`${employee.activeProjectStreak || 0} days`} />
                <InfoItem icon={<Star />} label="Rank" value={employee.rank || "Novice"} />
                <InfoItem icon={<Award />} label="Improvement Bonus" value={`+${employee.improvementBonus || 0}`} />
                <InfoItem icon={<AwardIcon />} label="Level Bonus" value={`+${employee.bonus || 0}`} />
                <InfoItem icon={<TrendingUp />} label="Last Stats Update" value={employee.lastStatsUpdate ? new Date(employee.lastStatsUpdate).toLocaleString() : "N/A"} />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Level Progress</h3>
                <Progress value={employee.levelProgress || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{employee.levelProgress ? employee.levelProgress.toFixed(0) : 0}% to next level</p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Current Project Progress</h3>
                <Progress value={employee.currentProjectProgress || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{employee.currentProjectProgress || 0}% Complete</p>
              </div>
            </TabsContent>
            <TabsContent value="tasks">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <TaskStatCard
                  icon={<CheckCircle className="text-green-500" />}
                  label="Completed Tasks"
                  value={completedTasks}
                  total={totalTasks}
                />
                <TaskStatCard
                  icon={<AlertCircle className="text-yellow-500" />}
                  label="Pending Tasks"
                  value={pendingTasks}
                  total={totalTasks}
                />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{task.title}</span>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={task.status === 'inProgress' ? 'default' : 'ghost'}
                          onClick={() => handleTaskUpdate(task.id, 'inProgress')}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant={task.status === 'done' ? 'default' : 'ghost'}
                          onClick={() => handleTaskUpdate(task.id, 'done')}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
           
            <TabsContent value="achievements">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <AchievementCard
                  icon={<Trophy className="text-yellow-500" />}
                  label="Current Streak"
                  value={`${employee.streak || 0} days`}
                />
                <AchievementCard
                  icon={<Star className="text-blue-500" />}
                  label="Total Points"
                  value={employee.points?.toString() || "0"}
                />
                <AchievementCard
                  icon={<TrendingUp className="text-green-500" />}
                  label="Tasks This Week"
                  value={employee.tasksCompletedThisWeek?.toString() || "0"}
                />
                <AchievementCard
                  icon={<Award className="text-purple-500" />}
                  label="Current Rank"
                  value={employee.rank || "Novice"}
                />
                <AchievementCard
                  icon={<Zap className="text-yellow-500" />}
                  label="Active Project Streak"
                  value={`${employee.activeProjectStreak || 0} days`}
                />
                <AchievementCard
                  icon={<AwardIcon className="text-red-500" />}
                  label="Improvement Bonus"
                  value={`+${employee.improvementBonus || 0}`}
                />
                <AchievementCard
                  icon={<AwardIcon className="text-indigo-500" />}
                  label="Level Bonus"
                  value={`+${employee.bonus || 0}`}
                />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Level Progress</h3>
                <Progress value={employee.levelProgress || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{employee.levelProgress ? employee.levelProgress.toFixed(0) : 0}% to next level</p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Incentives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IncentiveCard
                    icon={<Zap className="text-yellow-500" />}
                    label="Daily Streak Bonus"
                    description="Maintain your streak for bonus points!"
                  />
                  <IncentiveCard
                    icon={<Target className="text-red-500" />}
                    label="Weekly Goal"
                    description="Complete 20 tasks this week for a special badge!"
                  />
                  <IncentiveCard
                    icon={<AwardIcon className="text-indigo-500" />}
                    label="Level Bonus"
                    description="Reach new levels to earn additional bonuses!"
                  />
                  <IncentiveCard
                    icon={<Trophy className="text-green-500" />}
                    label="Top Performer"
                    description="Be among the top performers to receive exclusive rewards!"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to capitalize first letter
function capitalize(text: string) {
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
      <div className="flex-shrink-0 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

export default UserProfile
