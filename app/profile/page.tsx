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
  User
} from "lucide-react"
import { fetchEmployee, updateEmployee, Employee } from "@/models/employee"
import { fetchTasksEmail, updateTask, Task } from "@/models/task"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

function UserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && user.email) {
      fetchEmployeeData(user.email)
      fetchTasksData(user.email)
    }
  }, [user])

  const fetchEmployeeData = async (email: string) => {
    try {
      const emp = await fetchEmployee(email)
      setEmployee(emp)
      setNewName(emp.name)
    } catch (error) {
      console.error("Failed to fetch employee:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasksData = async (email: string) => {
    try {
      const fetchedTasks = await fetchTasksEmail(email, employee?.role || 'developer')
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
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageUrl(downloadURL)
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
        setEditMode(false)
      } catch (error) {
        console.error("Error updating name:", error)
      }
    }
  }

  const handleTaskUpdate = async (taskId: string, status: string) => {
    if (employee) {
      try {
        await updateTask({ id: taskId, status } as Task, employee.email)
        fetchTasksData(employee.email)
      } catch (error) {
        console.error("Error updating task:", error)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (authLoading || loading) {
    return <div>Loading...</div>
  }

  if (!user || !employee) {
    return <div>User not logged in or employee not found</div>
  }

  const completedTasks = tasks.filter(task => task.status === 'done').length
  const totalTasks = tasks.length
  const pendingTasks = totalTasks - completedTasks

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={employee.photoURL || "/placeholder.svg"} alt={employee.name} />
                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 rounded-full p-1"
                size="icon"
                variant="secondary"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button onClick={handleSaveName} size="icon" variant="ghost">
                    <Save className="h-4 w-4" />
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
              <Badge variant="secondary" className="mt-1">
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
          {progress > 0 && progress < 100 && (
            <div className="mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">{progress}% Complete</p>
            </div>
          )}
          {imageUrl && (
            <Button onClick={handleImageSave} className="mb-4">
              Save New Profile Picture
            </Button>
          )}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <InfoItem icon={<Mail />} label="Email" value={employee.email} />
                <InfoItem icon={<User />} label="Role" value={employee.role} />
                <InfoItem icon={<Briefcase />} label="Current Project" value={employee.currentProject || "N/A"} />
                <InfoItem icon={<Clock />} label="Availability" value={`${employee.availability || 0}%`} />
                <InfoItem icon={<Calendar />} label="Join Date" value={ "N/A"} />
                <InfoItem icon={<Target />} label="Points" value={employee.points?.toString() || "0"} />
                <InfoItem icon={<Trophy />} label="Streak" value={`${employee.streak || 0} days`} />
                <InfoItem icon={<Award />} label="Rank" value={employee.rank || "Novice"} />
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
                      <div>
                        <Button
                          size="sm"
                          variant={task.status === 'inProgress' ? 'default' : 'outline'}
                          className="mr-2"
                          onClick={() => handleTaskUpdate(task.id, 'inProgress')}
                        >
                          In Progress
                        </Button>
                        <Button
                          size="sm"
                          variant={task.status === 'done' ? 'default' : 'outline'}
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
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Level Progress</h3>
                <Progress value={employee.levelProgress || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{employee.levelProgress || 0}% to next level</p>
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
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
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

function TaskStatCard({ icon, label, value, total }: { icon: React.ReactNode; label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <h4 className="font-medium text-muted-foreground">{label}</h4>
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <Progress value={percentage} className="h-1 mb-1" />
        <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(0)}% of total</p>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IncentiveCard({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="flex-shrink-0">{icon}</div>
          <h4 className="font-medium">{label}</h4>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default UserProfile