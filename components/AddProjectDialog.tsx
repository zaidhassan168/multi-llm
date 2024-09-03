'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createProject } from '@/models/project'
import { Employee, fetchEmployees } from '@/models/employee'
import { PlusCircle } from "lucide-react"

export default function AddProjectDialog({ onProjectAdded }: { onProjectAdded: () => void }) {
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectManager, setNewProjectManager] = useState('')
  const [projectManagers, setProjectManagers] = useState<Employee[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        const employees = await fetchEmployees()
        const managers = employees.filter(emp => emp.role === 'projectManaager')
        setProjectManagers(managers)
      } catch (error: unknown) {
        console.error('Error fetching project managers:', error instanceof Error ? error.message : String(error))
        toast({
          title: 'Error',
          description: `Failed to fetch project managers: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        })
      }
    }

    fetchProjectManagers()
  }, [toast])

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
      const newProject = {
        name: newProjectName,
        manager: newProjectManager,
        currentStage: { name: 'Planning', completionTime: 0, owner: newProjectManager },
        onTrack: true,
      }
      await createProject(newProject)
      onProjectAdded() // Trigger refresh of projects in the parent component
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Enter the details for the new project.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="manager" className="text-right">
              Manager
            </Label>
            <select
              id="manager"
              value={newProjectManager}
              onChange={(e) => setNewProjectManager(e.target.value)}
              className="col-span-3 border p-2 rounded"
              aria-label="Select Project Manager"
            >
              <option value="" disabled>Select Manager</option>
              {projectManagers.map(manager => (
                <option key={manager.id} value={manager.email}>{manager.name} ({manager.email})</option>
              ))}
            </select>
          </div>
          {/* Add more fields here if needed */}
        </div>
        <Button onClick={handleAddProject}>Add Project</Button>
      </DialogContent>
    </Dialog>
  )
}
