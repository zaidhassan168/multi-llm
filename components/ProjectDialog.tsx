"use client"

import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createProject, updateProject } from '@/models/project'
import { Employee, fetchEmployees } from '@/models/employee'
import { PlusCircle, Loader2, Search, Edit } from "lucide-react"
import { ProcessSelector } from './ProcessSelector'
import { Stage } from '@/models/project'
import { motion, AnimatePresence } from 'framer-motion'
import { EmployeeSummary } from '@/models/summaries'
import { Project } from '@/models/project'
import { selectedProcessesAtom } from '@/lib/states/stageAtom'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ProjectDialogProps {
  project?: Project
  onProjectAdded?: () => void
  onProjectUpdated?: () => void
}

export default function ProjectDialog({ project, onProjectAdded, onProjectUpdated }: ProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [projectName, setProjectName] = useState(project?.name || '')
  const [projectManager, setProjectManager] = useState<EmployeeSummary | null>(project?.manager || null)
  const [projectManagers, setProjectManagers] = useState<Employee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeSummary[]>(project?.resources || [])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProcesses, setSelectedProcesses] = useAtom(selectedProcessesAtom)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    if (project && project.stages) {
      setSelectedProcesses(project.stages)
    }
  }, [project, setSelectedProcesses])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const fetchedEmployees = await fetchEmployees()
        setEmployees(fetchedEmployees)
        setFilteredEmployees(fetchedEmployees)
        setProjectManagers(fetchedEmployees.filter(emp => emp.role === 'projectManager'))
      } catch (error: unknown) {
        console.error('Error fetching employees:', error instanceof Error ? error.message : String(error))
        toast({
          title: 'Error',
          description: `Failed to fetch employees: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, toast])

  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const handleManagerChange = (value: string) => {
    const selectedManager = projectManagers.find(manager => manager.id === value);
    if (selectedManager) {
      const manager: EmployeeSummary = {
        id: selectedManager.id,
        name: selectedManager.name,
        email: selectedManager.email,
        role: selectedManager.role,
      };
      setProjectManager(manager);
    } else {
      setProjectManager(null);
    }
  };

  const handleEmployeeToggle = (employee: Employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.some(e => e.id === employee.id)
      if (isSelected) {
        return prev.filter(e => e.id !== employee.id)
      } else {
        return [...prev, {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
        }]
      }
    })
  }

  const handleProjectAction = async () => {
    if (!projectName || !projectManager || selectedProcesses.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one process",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const projectData: Omit<Project, "id"> = {
        name: projectName,
        manager: projectManager,
        stages: selectedProcesses,
        currentStage: {
          ...selectedProcesses[0],
          progress: selectedProcesses[0].progress as number | undefined
        },
        onTrack: project ? project.onTrack : true,
        resources: selectedEmployees,
      }

      if (project) {
        await updateProject({ ...projectData, id: project.id })
        onProjectUpdated?.()
        toast({
          title: "Success",
          description: "Project updated successfully",
        })
      } else {
        await createProject(projectData)
        onProjectAdded?.()
        toast({
          title: "Success",
          description: "New project added successfully",
        })
      }

      setIsOpen(false)
    } catch (error) {
      console.error('Error processing project:', error)
      toast({
        title: "Error",
        description: `Failed to ${project ? 'update' : 'add'} project`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={project ? "Edit project" : "Add new project"}>
          {project ? <Edit className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
          {project ? "Edit Project" : "Add Project"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>Enter the details for the project.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4">
          <motion.div
            className="space-y-6 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Project Manager</Label>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading project managers...</p>
                </div>
              ) : (
                <Select onValueChange={handleManagerChange} value={projectManager?.id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectManagers.map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name ? manager.name : manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Project Resources</Label>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading employees...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="border rounded-md">
                    <ScrollArea className="h-40 w-full">
                      <div className="p-1">
                        {filteredEmployees.map(employee => (
                          <div
                            key={employee.id}
                            className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                              selectedEmployees.some(e => e.id === employee.id)
                                ? 'bg-primary/20'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <Checkbox
                              id={`employee-${employee.id}`}
                              checked={selectedEmployees.some(e => e.id === employee.id)}
                              onCheckedChange={() => handleEmployeeToggle(employee)}
                            />
                            <Label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer">
                              {employee.name} ({employee.role})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Project Processes</Label>
              <ProcessSelector />
            </div>
          </motion.div>
        </ScrollArea>
        <DialogFooter>
          <Button
            onClick={handleProjectAction}
            disabled={!projectName || !projectManager || selectedProcesses.length === 0 || isProcessing}
            className="w-full mt-4"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {project ? "Updating Project..." : "Adding Project..."}
              </>
            ) : (
              project ? "Update Project" : "Add Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}