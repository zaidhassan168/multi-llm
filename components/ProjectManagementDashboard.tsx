'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, BarChart2, CheckCircle2, Clock, Users, AlertCircle } from "lucide-react"

interface Risk {
  id: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
}

interface Task {
  id: string
  name: string
  status: 'Not Started' | 'In Progress' | 'Completed'
  assignee: string
}

interface Stage {
  name: string
  completionTime: number
  owner: string
}

interface Project {
  id: string
  name: string
  progress: number
  risks: Risk[]
  tasks: Task[]
  currentStage: Stage
  onTrack: boolean
}

interface Employee {
  id: string
  name: string
  role: string
  availability: number
  currentProject: string
}

export default function ProjectManagementDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Website Redesign',
        progress: 65,
        risks: [
          { id: '1', description: 'Delayed content delivery', severity: 'Medium' },
          { id: '2', description: 'Browser compatibility issues', severity: 'Low' },
        ],
        tasks: [
          { id: '1', name: 'Design homepage', status: 'Completed', assignee: 'Alice Johnson' },
          { id: '2', name: 'Implement responsive layout', status: 'In Progress', assignee: 'Bob Smith' },
          { id: '3', name: 'Content migration', status: 'Not Started', assignee: 'Charlie Brown' },
        ],
        currentStage: { name: 'Development', completionTime: 14, owner: 'Bob Smith' },
        onTrack: true,
      },
      {
        id: '2',
        name: 'Mobile App Development',
        progress: 30,
        risks: [
          { id: '3', description: 'API integration delays', severity: 'High' },
          { id: '4', description: 'Performance issues on older devices', severity: 'Medium' },
        ],
        tasks: [
          { id: '4', name: 'Design user interface', status: 'Completed', assignee: 'Diana Prince' },
          { id: '5', name: 'Implement authentication', status: 'In Progress', assignee: 'Ethan Hunt' },
          { id: '6', name: 'Develop offline mode', status: 'Not Started', assignee: 'Fiona Gallagher' },
        ],
        currentStage: { name: 'Design', completionTime: 7, owner: 'Diana Prince' },
        onTrack: false,
      },
      {
        id: '3',
        name: 'CRM Integration',
        progress: 80,
        risks: [
          { id: '5', description: 'Data migration errors', severity: 'High' },
          { id: '6', description: 'User adoption challenges', severity: 'Medium' },
        ],
        tasks: [
          { id: '7', name: 'Database schema design', status: 'Completed', assignee: 'George Orwell' },
          { id: '8', name: 'API development', status: 'Completed', assignee: 'Huxley Brave' },
          { id: '9', name: 'User training materials', status: 'In Progress', assignee: 'Iris West' },
        ],
        currentStage: { name: 'Testing', completionTime: 5, owner: 'Fiona Gallagher' },
        onTrack: true,
      },
    ]

    const mockEmployees: Employee[] = [
      { id: '1', name: 'Alice Johnson', role: 'UX Designer', availability: 25, currentProject: 'Website Redesign' },
      { id: '2', name: 'Bob Smith', role: 'Frontend Developer', availability: 0, currentProject: 'Website Redesign' },
      { id: '3', name: 'Charlie Brown', role: 'Content Strategist', availability: 75, currentProject: 'Website Redesign' },
      { id: '4', name: 'Diana Prince', role: 'UI Designer', availability: 50, currentProject: 'Mobile App Development' },
      { id: '5', name: 'Ethan Hunt', role: 'Backend Developer', availability: 0, currentProject: 'Mobile App Development' },
      { id: '6', name: 'Fiona Gallagher', role: 'QA Engineer', availability: 100, currentProject: 'CRM Integration' },
      { id: '7', name: 'George Orwell', role: 'Database Administrator', availability: 25, currentProject: 'CRM Integration' },
      { id: '8', name: 'Huxley Brave', role: 'Full Stack Developer', availability: 0, currentProject: 'CRM Integration' },
      { id: '9', name: 'Iris West', role: 'Technical Writer', availability: 50, currentProject: 'CRM Integration' },
    ]

    setProjects(mockProjects)
    setEmployees(mockEmployees)
  }, [])

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Completed': return 'text-green-600'
      case 'In Progress': return 'text-yellow-600'
      case 'Not Started': return 'text-red-600'
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
            <div className="text-2xl font-bold">{projects.reduce((acc, project) => acc + project.tasks.length, 0)}</div>
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
                        {project.tasks.filter(task => task.status === 'Completed').length} / {project.tasks.length} completed
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