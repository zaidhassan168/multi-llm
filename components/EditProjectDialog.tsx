'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updateProject, Project } from '@/models/project'
import { ProcessSelector } from './ProcessSelector'
import { Stage } from '@/models/project'
import { motion } from 'framer-motion'

interface EditProjectDialogProps {
  project: Project;
  processes?: Stage[]
//   onProjectUpdated: () => void;
}

export function EditProjectDialog({ project, processes =[] }: EditProjectDialogProps) {
  const [projectName, setProjectName] = useState(project.name)
  const [selectedStages, setSelectedStages] = useState<Stage[]>( processes)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setProjectName(project.name)
      setSelectedStages(project.stages || [])
    }
  }, [isOpen, project])

  const handleUpdateProject = async () => {
    if (!projectName || selectedStages.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedProject: Project = {
        ...project,
        name: projectName,
        stages: selectedStages,
        currentStage: {
          ...selectedStages[0],
          progress: selectedStages[0].progress as number | undefined
        },
      }
      await updateProject(updatedProject)
      setIsOpen(false)
      toast({
        title: "Success",
        description: "Project updated successfully",
      })
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project details.</DialogDescription>
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
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <ProcessSelector 
          previousProcesses={processes}
            onProcessesSelected={setSelectedStages} 
          />
          <Button 
            onClick={handleUpdateProject} 
            disabled={!projectName || selectedStages.length === 0}
            className="w-full"
          >
            Update Project
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}