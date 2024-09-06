import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createProject } from '@/models/project'
import { Employee, fetchEmployees } from '@/models/employee'
import { PlusCircle } from "lucide-react"
import { ProcessSelector } from './ProcessSelector'
import { Stage } from '@/models/project'
import { motion } from 'framer-motion'
import { EmployeeSummary } from '@/models/summaries'
export default function AddProjectDialog({ onProjectAdded }: { onProjectAdded: () => void }) {
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectManager, setNewProjectManager] = useState<EmployeeSummary | null>(null)
  const [projectManagers, setProjectManagers] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProcesses, setSelectedProcesses] = useState<Stage[]>([])

  const { toast } = useToast()

  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        setIsLoading(true)
        const employees = await fetchEmployees()
        const managers = employees.filter(emp => emp.role === 'projectManager')
        setProjectManagers(managers)
        setIsLoading(false)
      } catch (error: unknown) {
        console.error('Error fetching project managers:', error instanceof Error ? error.message : String(error))
        toast({
          title: 'Error',
          description: `Failed to fetch project managers: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    }

    fetchProjectManagers()
  }, [toast])
  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedManager = projectManagers.find(manager => manager.id === e.target.value);
    if (selectedManager) {
      const manager: EmployeeSummary = {
        id: selectedManager.id,
        name: selectedManager.name,
        email: selectedManager.email,
        role: selectedManager.role,
        // Add any other fields that EmployeeSummary requires
      };
      setNewProjectManager(manager);
      console.log(manager);
    } else {
      setNewProjectManager(null);
    }
  };
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
        stages: selectedProcesses,
        currentStage: selectedProcesses[0],
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
        <Button variant="outline" size="sm" aria-label="Add new project">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Enter the details for the new project.</DialogDescription>
        </DialogHeader>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
      <Label htmlFor="manager">Manager</Label>
      {isLoading ? (
        <p>Loading project managers...</p>
      ) : (
        <select
          id="manager"
          value={newProjectManager ? newProjectManager.email : ''}
          onChange={(e) => {
            handleManagerChange(e);
          }}
          className="w-full border p-2 rounded"
          aria-label="Select Project Manager"
        >
          <option value="" disabled>Select Manager</option>
          {projectManagers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.name} ({manager.email})
            </option>
          ))}
        </select>
      )}
    </div>
          <ProcessSelector onProcessesSelected={setSelectedProcesses} />
          <Button 
            onClick={handleAddProject} 
            disabled={!newProjectName || !newProjectManager || selectedProcesses.length === 0}
            className="w-full"
          >
            Add Project
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}