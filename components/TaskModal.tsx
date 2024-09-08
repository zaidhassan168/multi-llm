import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Task } from '@/models/task'
import { CalendarIcon, EditIcon, SaveIcon, TrashIcon, ClockIcon, UserIcon, FlagIcon, LayersIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchProjects } from '@/models/project'
import { fetchEmployees } from '@/models/employee'
import { EmployeeSummary, TaskSummary } from '@/models/summaries'

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
  const [isEditMode, setIsEditMode] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; stages: { id: string; name: string }[] }[]>([])
  const [developers, setDevelopers] = useState<EmployeeSummary[]>([])
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    time: 0,
    efforts: 'backend',
    assignee: {} as EmployeeSummary,
    status: 'backlog',
    createdAt: new Date(),
    projectId: '',
    reporter: {} as EmployeeSummary,
    priority: 'low',
    dueDate: undefined,
    comments: [],
    stageId: '',
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
        assignee: {} as EmployeeSummary,
        status: 'backlog',
        createdAt: new Date(),
        projectId: '',
        reporter: {} as EmployeeSummary,
        priority: 'low',
        dueDate: undefined,
        comments: [],
        stageId: '',
      })
      setIsEditMode(true)
    }
  }, [task])

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const projectsData = await fetchProjects()
        console.log('projectsData:', projectsData.forEach(p => console.log(p.stages)))
        setProjects(projectsData.map(p => ({ 
          id: p.id, 
          name: p.name, 
          stages: p.stages?.map(stage => ({ id: stage.id, name: stage.name })) || [] 
        })))

        const developersData = await fetchEmployees()
        const devs = developersData.filter(emp => emp.role === 'developer')
        setDevelopers(devs)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load projects and developers data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({ ...prev, projectId }))
    const selectedProject = projects.find(p => p.id === projectId)
    if (selectedProject) {
      setStages(selectedProject.stages)
    }
  }

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
      <DialogContent className="sm:max-w-[700px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-3xl font-bold text-gray-800">
            <span>{task ? (isEditMode ? 'Edit Task' : 'Task Details') : 'Add New Task'}</span>
            {task && !isEditMode && (
              <Button variant="outline" size="icon" onClick={handleEdit} className="hover:bg-gray-100">
                <EditIcon className="h-5 w-5 text-gray-600" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task ? (isEditMode ? 'Edit the details of your task.' : 'View task details.') : 'Add a new task to your board.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 font-semibold">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={!isEditMode && !!task}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId" className="text-gray-700 font-semibold">
                  Project
                </Label>
                <Select
                  name="projectId"
                  value={formData.projectId}
                  onValueChange={handleProjectChange}
                  disabled={!isEditMode && !!task}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
              {stages?.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="stageId" className="text-gray-700 font-semibold">
                    Stage
                  </Label>
                  <Select
                    name="stageId"
                    value={formData.stageId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stageId: value }))}
                    disabled={!isEditMode && !!task}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={!isEditMode && !!task}
                className="border-gray-300 focus:border-blue-500 h-24"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="time" className="text-gray-700 font-semibold">
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
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <LayersIcon className="h-5 w-5 text-gray-500" />
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="efforts" className="text-gray-700 font-semibold">
                    Efforts
                  </Label>
                  <Select
                    name="efforts"
                    value={formData.efforts}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, efforts: value as Task['efforts'] }))}
                    disabled={!isEditMode && !!task}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FlagIcon className="h-5 w-5 text-gray-500" />
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="status" className="text-gray-700 font-semibold">
                    Status
                  </Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}
                    disabled={!isEditMode && !!task}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
              </div>
              <div className="flex items-center space-x-2">
                <FlagIcon className="h-5 w-5 text-gray-500" />
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="priority" className="text-gray-700 font-semibold">
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <div className="space-y-2 flex-grow">
                <Label htmlFor="assignee" className="text-gray-700 font-semibold">
                  Assignee
                </Label>
                <Select
                  name="assignee"
                  value={formData.assignee.name}
                  onValueChange={(value) => {
                    const selectedDev = developers.find(dev => dev.name === value);
                    if (selectedDev) {
                      setFormData(prev => ({
                        ...prev,
                        assignee: {
                          id: selectedDev.id,
                          name: selectedDev.name,
                          email: selectedDev.email,
                          role: selectedDev.role
                        }
                      }));
                    }
                  }}
                  disabled={!isEditMode && !!task}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
            </div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <div className="space-y-2 flex-grow">
                <Label htmlFor="dueDate" className="text-gray-700 font-semibold">
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 focus:border-blue-500",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                      disabled={!isEditMode && !!task}
                    >
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
          </div>
          {isEditMode && (
            <div className="flex justify-between pt-6">
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2">
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