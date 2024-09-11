"use client"

import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createProject } from '@/models/project'
import { Employee, fetchEmployees } from '@/models/employee'
import { PlusCircle, Loader2, Search } from "lucide-react"
import { ProcessSelector } from './ProcessSelector'
import { Stage } from '@/models/project'
import { motion, AnimatePresence } from 'framer-motion'
import { EmployeeSummary } from '@/models/summaries'
import { Project } from '@/models/project'
import { selectedProcessesAtom } from '@/lib/states/stageAtom'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function AddProjectDialog({ onProjectAdded }: { onProjectAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectManager, setNewProjectManager] = useState<EmployeeSummary | null>(null)
  const [projectManagers, setProjectManagers] = useState<Employee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProcesses, setSelectedProcesses] = useAtom(selectedProcessesAtom)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { toast } = useToast()

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
      setNewProjectManager(manager);
    } else {
      setNewProjectManager(null);
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

  const handleAddProject = async () => {
    if (!newProjectName || !newProjectManager || selectedProcesses.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one process",
        variant: "destructive",
      })
      return
    }

    setIsAddingProject(true)
    try {
      console.log("Selected Processes:", selectedEmployees)
      const newProject: Omit<Project, "id"> = {
        name: newProjectName,
        manager: newProjectManager,
        stages: selectedProcesses,
        currentStage: {
          ...selectedProcesses[0],
          progress: selectedProcesses[0].progress as number | undefined
        },
        onTrack: true,
        resources: selectedEmployees,
      }
      await createProject(newProject)
      onProjectAdded()
      toast({
        title: "Success",
        description: "New project added successfully",
      })
      setNewProjectName('')
      setNewProjectManager(null)
      setSelectedProcesses([])
      setSelectedEmployees([])
      setIsOpen(false)
    } catch (error) {
      console.error('Error adding new project:', error)
      toast({
        title: "Error",
        description: "Failed to add new project",
        variant: "destructive",
      })
    } finally {
      setIsAddingProject(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Add new project">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Enter the details for the new project.</DialogDescription>
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
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
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
                <Select onValueChange={handleManagerChange} value={newProjectManager?.id}>
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
            onClick={handleAddProject}
            disabled={!newProjectName || !newProjectManager || selectedProcesses.length === 0 || isAddingProject}
            className="w-full mt-4"
          >
            {isAddingProject ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Project...
              </>
            ) : (
              'Add Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}