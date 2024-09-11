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
import { PlusCircle, Loader2 } from "lucide-react"
import { ProcessSelector } from './ProcessSelector'
import { Stage } from '@/models/project'
import { motion, AnimatePresence } from 'framer-motion'
import { EmployeeSummary } from '@/models/summaries'
import { Project } from '@/models/project'
import { selectedProcessesAtom } from '@/lib/states/stageAtom'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddProjectDialog({ onProjectAdded }: { onProjectAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectManager, setNewProjectManager] = useState<EmployeeSummary | null>(null)
  const [projectManagers, setProjectManagers] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProcesses, setSelectedProcesses] = useAtom(selectedProcessesAtom)
  const [isAddingProject, setIsAddingProject] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        setIsLoading(true)
        const employees = await fetchEmployees()
        const managers = employees.filter(emp => emp.role === 'projectManager')
        setProjectManagers(managers)
      } catch (error: unknown) {
        console.error('Error fetching project managers:', error instanceof Error ? error.message : String(error))
        toast({
          title: 'Error',
          description: `Failed to fetch project managers: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchProjectManagers()
    }
  }, [isOpen, toast])

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

  const handleAddProject = async () => {
    if (!newProjectName || !newProjectManager || selectedProcesses.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one process",
        variant: "destructive",
      })
      return
    }

    setIsAddingProject(true)
    try {
      const newProject: Omit<Project, "id"> = {
        name: newProjectName,
        manager: newProjectManager,
        stages: selectedProcesses,
        currentStage: {
          ...selectedProcesses[0],
          progress: selectedProcesses[0].progress as number | undefined
        },
        onTrack: true,
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
      <DialogContent className="sm:max-w-[550px] h-[90vh] flex flex-col">
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