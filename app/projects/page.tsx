'use client'

import React, { useState, useEffect } from 'react'
import { Project, fetchProjects } from '@/models/project'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { motion } from "framer-motion"
import { Search, Filter, CheckCircle, AlertCircle, Clock, Users, BarChart2, Layers, Calendar } from "lucide-react"
import Link from 'next/link'
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadProjects = async () => {
      const fetchedProjects = await fetchProjects()
      setProjects(fetchedProjects)
      setFilteredProjects(fetchedProjects)
    }
    loadProjects()
  }, [])

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === 'all' ||
        (filterStatus === 'onTrack' && project.onTrack) ||
        (filterStatus === 'offTrack' && !project.onTrack))
    )
    setFilteredProjects(filtered)
  }, [searchTerm, filterStatus, projects])

  const getStatusColor = (onTrack: boolean | undefined) => {
    return onTrack ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getProgressColor = (progress: number | undefined) => {
    if (progress === undefined) return 'bg-gray-200'
    if (progress < 25) return 'bg-red-500'
    if (progress < 50) return 'bg-yellow-500'
    if (progress < 75) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">Projects Overview</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400" />
          <select
            title='Filter by status'
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="onTrack">On Track</option>
            <option value="offTrack">Off Track</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <Link href={`/projects/${project.id}`} className="text-xl font-semibold hover:text-blue-600 transition-colors">
                    {project.name}
                  </Link>
                  <Badge className={getStatusColor(project.onTrack)}>
                    {project.onTrack ? 'On Track' : 'Off Track'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <Layers className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Current Stage: </span>
                    <span className="text-sm ml-2">{project.currentStage?.name || 'Not set'}</span>
                  </div>
                  <div className="flex items-center mb-4">
                    <Users className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Manager: </span>
                    <span className="text-sm ml-2">{project.manager?.name || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center mb-4">
                    <BarChart2 className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Progress: </span>
                    <span className="text-sm ml-2">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress} className={`w-full ${getProgressColor(project.progress)}`} />
                </div>

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="tasks">
                    <AccordionTrigger>Task Overview</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Tasks:</span>
                          <span>{project.totalTasks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>{project.totalTasksCompleted || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incomplete:</span>
                          <span>{project.totalTasksIncomplete || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overdue:</span>
                          <span>{project.totalTasksOverdue || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>On Track:</span>
                          <span>{project.totalTasksOnTrack || 0}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="hours">
                    <AccordionTrigger>Hours Overview</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Hours:</span>
                          <span>{project.totalTasksHours || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hours Completed:</span>
                          <span>{project.tasksHoursCompleted || 0}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between items-center">
                  <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                      <span className="text-sm text-gray-500 cursor-pointer hover:text-green-600">
                        Resources: {project.resources?.length || 0}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <h3 className="text-lg font-semibold mb-2">Project Resources</h3>
                      {project.resources && project.resources.length > 0 ? (
                        <ul className="space-y-1">
                          {project.resources.map((resource, index) => (
                            <li key={index} className="text-sm">
                              {resource.name} - {resource.role || 'No role specified'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No resources assigned</p>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                  <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                      <span className="text-sm text-gray-500 cursor-pointer hover:text-green-600">
                        Stages: {project.stages?.length || 0}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <h3 className="text-lg font-semibold mb-3">Project Stages</h3>
                      {project.stages && project.stages.length > 0 ? (
                        <ul className="space-y-3">
                          {project.stages.map((stage, index) => (
                            <li key={index} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{stage.name}</span>
                                <span className="text-xs text-gray-500">{Number(stage.progress) || 0}%</span>
                              </div>
                              <Progress
                                value={Number(stage.progress)}
                                className="w-full h-2"
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No stages defined</p>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}