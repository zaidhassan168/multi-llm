import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/types/tasks'
import { useState, useEffect } from 'react'
type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onSave: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskModal({ isOpen, onClose, task, onSave, onDelete }: TaskModalProps) {
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    time: 0,
    efforts: 'backend',
    assignee: '',
    status: 'backlog',
    createdAt: new Date(),
  })

  useEffect(() => {
    if (task) {
      setFormData(task)
    } else {
      setFormData({
        title: '',
        description: '',
        time: 0,
        efforts: 'backend',
        assignee: '',
        status: 'backlog',
        createdAt: new Date(),
      })
    }
  }, [task])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'time' ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(task ? { ...formData, id: task.id } : formData as Task)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Edit the details of your task.' : 'Add a new task to your board.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="time">Time (hours)</Label>
            <Input id="time" name="time" type="number" value={formData.time} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="efforts">Efforts</Label>
            <Select name="efforts" value={formData.efforts} onValueChange={(value) => setFormData(prev => ({ ...prev, efforts: value as Task['efforts'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select efforts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend + frontend">Backend + Frontend</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Input id="assignee" name="assignee" value={formData.assignee} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <Button type="submit">{task ? 'Update' : 'Add'} Task</Button>
            {task && (
              <Button variant="destructive" onClick={() => {
                onDelete(task.id)
                onClose()
              }}>
                Delete Task
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}