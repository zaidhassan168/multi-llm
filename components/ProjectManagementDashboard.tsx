'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, BarChart2, CheckCircle2, Clock, Users, AlertCircle } from "lucide-react"
import { Task } from '@/types/tasks'
import { Project, Employee, Risk} from '@/types/tasks'
import { useAuth } from '@/lib/hooks'
export default function ProjectManagementDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const {user} = useAuth()
  const fetchTasks = async () => {
    try {
      console.log(user
      )
      const response = await fetch(`/api/tasks?email=${user?.email}`)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // toast({
      //   title: 'Error',
      //   description: 'Failed to fetch tasks',
      //   variant: 'destructive'
      // })
    }
  }
  useEffect(() => {
    if (user?.email) {
      fetchTasks()
    }
  }, [user])

  useEffect(() => {
    // Map tasks to projects and employees
    const projectMap = new Map<string, Project>()
    const employeeMap = new Map<string, Employee>()

    tasks.forEach(task => {
      const projectName = task.projectName || 'Unknown Project'

      // Map task to its project
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          id: projectName,
          name: projectName,
          progress: 0,
          risks: [],
          tasks: [],
          currentStage: { name: '', completionTime: 0, owner: '' },
          onTrack: true,
        })
      }
      const project = projectMap.get(projectName)!
      project.tasks.push(task)

      // Calculate project progress
      const completedTasks = project.tasks.filter(t => t.status === 'done').length
      project.progress = Math.round((completedTasks / project.tasks.length) * 100)

      // Assume last task is the current stage
      const lastTask = project.tasks[project.tasks.length - 1]
      project.currentStage = {
        name: lastTask.title,
        completionTime: lastTask.time,
        owner: lastTask.assignee
      }

      // Map task to its employee
      if (task.assignee) {
        if (!employeeMap.has(task.assignee)) {
          employeeMap.set(task.assignee, {
            id: task.assignee,
            name: task.assignee,
            role: task.efforts, // Assuming role is related to effort
            availability: 100, // Default value, could be calculated based on task load
            currentProject: projectName
          })
        }
        const employee = employeeMap.get(task.assignee)!
        employee.currentProject = projectName
        employee.availability -= 25 // Decrease availability for each assigned task (for example)
      }
    })

    setProjects(Array.from(projectMap.values()))
    setEmployees(Array.from(employeeMap.values()))
  }, [tasks])

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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Project Management Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.reduce((acc, project) => acc + project.risks.length, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
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
          <Card>
            <CardHeader>
              <CardTitle>CEO Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Stage Completion (Days)</TableHead>
                    <TableHead>Stage Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress value={project.progress} className="w-[60%]" />
                          <span className="ml-2">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.currentStage.name}</TableCell>
                      <TableCell>{project.currentStage.completionTime}</TableCell>
                      <TableCell>{project.currentStage.owner}</TableCell>
                      <TableCell>
                        <span className={`flex items-center ${getTrackStatusColor(project.onTrack)}`}>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                    <TableHead>Progress</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Risks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress value={project.progress} className="w-[60%]" />
                          <span className="ml-2">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.tasks.filter(task => task.status === 'done').length} / {project.tasks.length} completed
                      </TableCell>
                      <TableCell>{project.risks.length} identified</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.flatMap((project) =>
                    project.risks.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{risk.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                      <TableCell>{employee.currentProject}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${getAvailabilityColor(employee.availability)}`}>
                          {employee.availability}%
                        </span>
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
