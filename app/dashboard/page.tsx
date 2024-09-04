'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, BarChart2, CheckCircle2, Clock, Users, AlertCircle, DollarSign, TrendingUp, TrendingDown, PlusCircle } from "lucide-react"
import { Task, updateTask, deleteTask, fetchTasksAll } from '@/models/task'
import { Project, Stage, fetchProjects, updateProject, deleteProject, createProject } from '@/models/project'
import { Risk, fetchRisks, updateRisk, deleteRisk } from '@/models/risk'
import { Employee, fetchEmployees, updateEmployee, deleteEmployee } from '@/models/employee'
import { useAuth } from '@/lib/hooks'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useToast } from "@/components/ui/use-toast"
import AddProjectDialog from "@/components/AddProjectDialog"
import Link from 'next/link'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function ProjectManagementDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const { user } = useAuth()
  const { toast } = useToast()
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectManager, setNewProjectManager] = useState('')
  useEffect(() => {
    if (user?.email) {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    try {
      const [tasksData, projectsData, risksData, employeesData] = await Promise.all([
        fetchTasksAll(),
        fetchProjects(),
        fetchRisks(),
        fetchEmployees()
      ])
      setTasks(tasksData)
      setProjects(projectsData)
      setRisks(risksData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive'
      })
    }
  }
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'text-green-600'
      case 'inProgress': return 'text-yellow-600'
      case 'todo': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityColor = (severity: Risk['severity']) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 75) return 'text-green-600'
    if (availability >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrackStatusColor = (onTrack: boolean) => {
    return onTrack ? 'text-green-600' : 'text-red-600'
  }

  const projectStatusData = [
    { name: 'On Track', value: projects.filter(p => p.onTrack).length },
    { name: 'Off Track', value: projects.filter(p => !p.onTrack).length },
  ]

  const taskStatusData = [
    { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length },
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'inProgress').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
  ]

  const calculateProjectProgress = (project: Project): number => {
    const projectTasks = tasks.filter(task => task.projectId === project.id)
    const completedTasks = projectTasks.filter(task => task.status === 'done').length
    return projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
  }
  const handleAddProject = async () => {
    if (!newProjectName || !newProjectManager) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newProject: Omit<Project, 'id'> = {
        name: newProjectName,
        manager: newProjectManager,
        // currentStage: { name: 'Planning', completionTime: 0, owner: newProjectManager },
        onTrack: true,
      }
      await createProject(newProject)
      await fetchAllData()
      toast({
        title: "Success",
        description: "New project added successfully",
      })
      setNewProjectName('')
      setNewProjectManager('')
    } catch (error) {
      console.error('Error adding new project:', error)
      toast({
        title: "Error",
        description: "Failed to add new project",
        variant: "destructive",
      })
    }
  }
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Project Management Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {projects.filter(p => p.onTrack).length} on track
              </p>
              <AddProjectDialog onProjectAdded={fetchAllData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status === 'done').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Overview</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.length} Total</div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-red-600 font-semibold">
                {risks.filter(r => r.severity === 'High').length} High
              </span>
              <span className="text-xs text-yellow-600 font-semibold">
                {risks.filter(r => r.severity === 'Medium').length} Medium
              </span>
              <span className="text-xs text-green-600 font-semibold">
                {risks.filter(r => r.severity === 'Low').length} Low
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ceo-overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ceo-overview">CEO Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="resources">Resource Management</TabsTrigger>
        </TabsList>
        <TabsContent value="ceo-overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Task Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link href={`/project/${project.id}`}>
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>{project.manager}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress value={calculateProjectProgress(project)} className="w-[60%]" />
                          <span className="ml-2">{calculateProjectProgress(project)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.currentStage?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`flex items-center ${getTrackStatusColor(project.onTrack ?? false)}`}>
                          {project.onTrack ? (
                            <>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              On Track
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-1 h-4 w-4" />
                              Off Track
                            </>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}                </TableBody>              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Risk Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Probability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-medium">
                        {projects.find(p => p.id === risk.projectId)?.name || 'Unknown Project'}
                      </TableCell>
                      <TableCell>{risk.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                          {risk.severity}
                        </span>
                      </TableCell>
                      <TableCell>{risk.probability}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Current Project</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.currentProject || 'Not Assigned'}</TableCell>
                      <TableCell>
                        {employee.availability !== undefined ? (
                          <span className={`font-bold ${getAvailabilityColor(employee.availability)}`}>
                            {employee.availability}%
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}