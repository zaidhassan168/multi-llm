"use client"

import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createProject, updateProject } from '@/models/project'
import { Employee, fetchEmployees } from '@/models/employee'
import { PlusCircle, Loader2, Search, Edit, Users, Briefcase, Layers } from "lucide-react"
import { ProcessSelector } from './ProcessSelector'
import { EmployeeSummary } from '@/models/summaries'
import { Project } from '@/models/project'
import { selectedProcessesAtom } from '@/lib/states/stageAtom'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
      setProjectManager({
        id: selectedManager.id,
        name: selectedManager.name,
        email: selectedManager.email,
        role: selectedManager.role,
      });
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
        toast({ title: "Success", description: "Project updated successfully" })
      } else {
        await createProject(projectData)
        onProjectAdded?.()
        toast({ title: "Success", description: "New project added successfully" })
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
        <Button variant="outline" size="sm">
          {project ? <Edit className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
          {project ? "Edit Project" : "Add Project"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:h-[90vh] p-0 bg-card-background rounded-lg overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
          <DialogHeader className="px-6 py-4 bg-background rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-center text-foreground">
              {project ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="flex-grow flex flex-col">
            <TabsList className="w-full justify-start px-6 py-2 bg-background">
              <TabsTrigger value="details" className="data-[state=active]:bg-primary/20">
                <Briefcase className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-primary/20">
                <Users className="w-4 h-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="processes" className="data-[state=active]:bg-primary/20">
                <Layers className="w-4 h-4 mr-2" />
                Processes
              </TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-grow px-6 py-4">
              <TabsContent value="details" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-lg font-semibold">Project Name</Label>
                    <Input
                      id="name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager" className="text-lg font-semibold">Project Manager</Label>
                    {isLoading ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading project managers...</p>
                      </div>
                    ) : (
                      <Select onValueChange={handleManagerChange} value={projectManager?.id}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select a project manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectManagers.map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name || manager.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="team" className="mt-0">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Project Resources</Label>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading employees...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          type="text"
                          placeholder="Search employees..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredEmployees.map(employee => (
                          <div
                            key={employee.id}
                            className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                              selectedEmployees.some(e => e.id === employee.id)
                                ? 'bg-primary/20'
                                : 'bg-background hover:bg-accent'
                            }`}
                          >
                            <Checkbox
                              id={`employee-${employee.id}`}
                              checked={selectedEmployees.some(e => e.id === employee.id)}
                              onCheckedChange={() => handleEmployeeToggle(employee)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.photoURL} alt={employee.name} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer">
                              {employee.name}
                              <span className="block text-xs text-muted-foreground">{employee.role}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="processes" className="mt-0">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Project Processes</Label>
                  <ProcessSelector />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          <DialogFooter className="px-6 py-4 bg-background rounded-b-lg mt-auto">
            <div className="w-full flex ">
              <Button
                onClick={handleProjectAction}
                disabled={!projectName || !projectManager || selectedProcesses.length === 0 || isProcessing}
                className="w-1/7"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {project ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  project ? "Update Project" : "Create Project"
                )}
              </Button>
            </div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}