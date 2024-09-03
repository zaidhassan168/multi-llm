import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Task } from '@/models/task'
import { CalendarIcon, EditIcon, SaveIcon, TrashIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchProjects } from '@/models/project'
import { fetchEmployees } from '@/models/employee'

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onSave: (task: Task) => void
  onDelete: (id: string) => void
  onEdit: () => void
}

const priorityColors = {
  low: 'bg-green-100 border-green-500 text-green-700',
  medium: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  high: 'bg-orange-100 border-orange-500 text-orange-700',
  urgent: 'bg-red-100 border-red-500 text-red-700',
  critical: 'bg-purple-100 border-purple-500 text-purple-700',
  null: 'bg-gray-100 border-gray-500 text-gray-700',
}

export function TaskModal({ isOpen, onClose, task, onSave, onDelete, onEdit }: TaskModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [developers, setDevelopers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    time: 0,
    efforts: 'backend',
    assignee: '',
    status: 'backlog',
    createdAt: new Date(),
    projectId: '',
    reporter: '',
    priority: 'low',
    dueDate: undefined,
    comments: [],
    assigneeEmail: '',
    reporterEmail: '',
  })

  useEffect(() => {
    if (task) {
      setFormData(task)
      setIsEditMode(false)
    } else {
      setFormData({
        title: '',
        description: '',
        time: 0,
        efforts: 'backend',
        assignee: '',
        status: 'backlog',
        createdAt: new Date(),
        projectId: '',
        reporter: '',
        priority: 'low',
        dueDate: undefined,
        comments: [],
        assigneeEmail: '',
        reporterEmail: '',
      })
      setIsEditMode(true)
    }
  }, [task])

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const projectsData = await fetchProjects()
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })))

        const developersData = await fetchEmployees()
        const devs = developersData.filter(emp => emp.role === 'developer')
        setDevelopers(devs.map(dev => ({ id: dev.id, name: dev.name, email: dev.email })))
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load projects and developers data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'time' ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(task ? { ...formData, id: task.id } : formData as Task)
    setIsEditMode(false)
  }

  const handleEdit = () => {
    setIsEditMode(true)
    onEdit()
  }

  const taskPriorities = ['low', 'medium', 'high', 'urgent', 'critical', 'null']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-gradient-to-br from-blue-50 to-purple-50">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-2xl font-bold text-blue-700">
            <span>{task ? (isEditMode ? 'Edit Task' : 'Task Details') : 'Add New Task'}</span>
            {task && !isEditMode && (
              <Button variant="outline" size="icon" onClick={handleEdit} className="hover:bg-blue-100">
                <EditIcon className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            {task ? (isEditMode ? 'Edit the details of your task.' : 'View task details.') : 'Add a new task to your board.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-blue-700 font-semibold">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={!isEditMode && !!task}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId" className="text-blue-700 font-semibold">
                Project Name
              </Label>
              <Select
                name="projectId"
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                disabled={!isEditMode && !!task}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-blue-700 font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={!isEditMode && !!task}
              className="border-blue-200 focus:border-blue-400 h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="time" className="text-blue-700 font-semibold">
                Time (hours)
              </Label>
              <Input
                id="time"
                name="time"
                type="number"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={!isEditMode && !!task}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="efforts" className="text-blue-700 font-semibold">
                Efforts
              </Label>
              <Select
                name="efforts"
                value={formData.efforts}
                onValueChange={(value) => setFormData(prev => ({ ...prev, efforts: value as Task['efforts'] }))}
                disabled={!isEditMode && !!task}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select efforts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend + frontend">Backend + Frontend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-blue-700 font-semibold">
                Status
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}
                disabled={!isEditMode && !!task}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
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
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-blue-700 font-semibold">
                Priority
              </Label>
              <Select
                name="priority"
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Task['priority'] }))}
                disabled={!isEditMode && !!task}
              >
                <SelectTrigger className={`border-2 ${priorityColors[formData.priority as keyof typeof priorityColors]}`}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority} className={priorityColors[priority as keyof typeof priorityColors]}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-blue-700 font-semibold">
                Assignee
              </Label>
              <Select
                name="assignee"
                value={formData.assignee}
                onValueChange={(value) => {
                  console.log("Selected Assignee ID:", value); // Log the selected value (Assignee ID)

                  const selectedDev = developers.find(dev => dev.name === value);

                  if (selectedDev) {
                    console.log("Selected Developer:", selectedDev); // Log the selected developer's details

                    setFormData(prev => {
                      const updatedFormData = {
                        ...prev,
                        assignee: selectedDev.name,
                        assigneeEmail: selectedDev.email,
                      };

                      console.log("Updated Task Data:", updatedFormData); // Log the updated task data

                      return updatedFormData;
                    });
                  }
                }}
                disabled={!isEditMode && !!task}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {developers.map((dev) => (
                    <SelectItem key={dev.id} value={dev.name}>
                      {dev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-blue-700 font-semibold">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal border-blue-200 focus:border-blue-400",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                    disabled={!isEditMode && !!task}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {isEditMode && (
            <div className="flex justify-between">
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
                <SaveIcon className="h-4 w-4" />
                {task ? 'Update' : 'Add'} Task
              </Button>
              {task && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(task.id)
                    onClose()
                  }}
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Task
                </Button>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
