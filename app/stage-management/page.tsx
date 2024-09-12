"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { Stage, fetchStages, createStage, updateStage, deleteStage } from '@/models/stage'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const processGroups = [
  { name: 'Initiating', color: 'text-red-500/70 border-red-500/70' },
  { name: 'Planning', color: 'text-blue-500/70 border-blue-500/70' },
  { name: 'Executing', color: 'text-green-500/70 border-green-500/70' },
  { name: 'Monitoring and Controlling', color: 'text-yellow-500/70 border-yellow-500/70' },
  { name: 'Closing', color: 'text-purple-500/70 border-purple-500/70' },
]

export default function StageManagement() {
  const [stages, setStages] = useState<Stage[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStages().then(setStages).catch(error => toast({ title: "Error", description: error.message, variant: "destructive" }))
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const stageData = {
      name: formData.get('name') as string,
      owner: formData.get('owner') as string,
      processGroup: formData.get('processGroup') as string,
      knowledgeArea: formData.get('knowledgeArea') as string,
    }

    try {
      if (editingStage) {
        const updatedStage = await updateStage({ ...stageData, id: editingStage.id })
        setStages(stages.map(stage => stage.id === updatedStage.id ? updatedStage : stage))
        toast({ title: "Success", description: "Stage updated successfully" })
      } else {
        const newStage = await createStage(stageData)
        setStages([...stages, newStage])
        toast({ title: "Success", description: "Stage created successfully" })
      }
      setIsDialogOpen(false)
      setEditingStage(null)
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this stage?")) {
      setIsLoading(true)
      try {
        await deleteStage(id)
        setStages(stages.filter(stage => stage.id !== id))
        toast({ title: "Success", description: "Stage deleted successfully" })
      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stage Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStage(null)} variant="outline" className="bg-white">
              <Plus className="mr-2 h-4 w-4" /> Add New Stage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStage ? 'Edit Stage' : 'Create New Stage'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editingStage?.name} required />
              </div>
              <div>
                <Label htmlFor="processGroup">Process Group</Label>
                <Select name="processGroup" defaultValue={editingStage?.processGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a process group" />
                  </SelectTrigger>
                  <SelectContent>
                    {processGroups.map((group) => (
                      <SelectItem key={group.name} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingStage ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingStage ? 'Update' : 'Create'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
        {processGroups.map((group) => (
          <div key={group.name} className="space-y-4">
            <div className={`text-center py-2 rounded-t-lg ${group.color.replace('text-', 'bg-').replace('/70', '/20')}`}>
              <h2 className={`text-lg font-semibold ${group.color} uppercase tracking-wide`}>
                {group.name}
              </h2>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 bg-gray-50 rounded-b-lg p-4">
              {stages
                .filter(stage => stage.processGroup === group.name)
                .map(stage => (
                  <div key={stage.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-sm">
                    <h3 className="font-medium text-base mb-1">{stage.name}</h3>
                    <p className="text-gray-600 mb-1">Owner: {stage.owner}</p>
                    <p className="text-gray-600 mb-2">Knowledge Area: {stage.knowledgeArea}</p>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(stage)} disabled={isLoading}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(stage.id)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}