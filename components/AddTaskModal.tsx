'use client'

import React, { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Task, addTask, updateTask, deleteTask } from '@/models/task'
import { CalendarIcon, EditIcon, SaveIcon, XIcon, TrashIcon, ClockIcon, UserIcon, FlagIcon, LayersIcon, BugIcon, LightbulbIcon, FileTextIcon, CheckSquareIcon, RefreshCcwIcon, HelpCircleIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchProjects } from '@/models/project'
import { fetchEmployees } from '@/models/employee'
import { EmployeeSummary, TaskSummary } from '@/models/summaries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircleIcon, AlertTriangleIcon, AlertOctagonIcon, BellIcon } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/hooks"

type AddTaskModalProps = {
  isOpen: boolean
  onClose: () => void
  projectId?: string
  task?: Task | null | undefined;
    onTaskAdded?: () => void
  onTaskUpdated?: () => void
}

const priorityColors = {
  low: 'bg-green-100 border-green-500 text-green-700',
  medium: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  high: 'bg-orange-100 border-orange-500 text-orange-700',
  urgent: 'bg-red-100 border-red-500 text-red-700',
  critical: 'bg-purple-100 border-purple-500 text-purple-700',
  null: 'bg-gray-100 border-gray-500 text-gray-700',
}

const priorityIcons = {
  low: { icon: FlagIcon, color: priorityColors.low },
  medium: { icon: AlertCircleIcon, color: priorityColors.medium },
  high: { icon: AlertTriangleIcon, color: priorityColors.high },
  urgent: { icon: AlertOctagonIcon, color: priorityColors.urgent },
  critical: { icon: BellIcon, color: priorityColors.critical },
  null: { icon: HelpCircleIcon, color: priorityColors.null },
}

const taskTypeIcons = {
  bug: { icon: BugIcon, color: 'text-red-500' },
  feature: { icon: LightbulbIcon, color: 'text-yellow-500' },
  documentation: { icon: FileTextIcon, color: 'text-blue-500' },
  task: { icon: CheckSquareIcon, color: 'text-green-500' },
  changeRequest: { icon: RefreshCcwIcon, color: 'text-purple-500' },
  other: { icon: HelpCircleIcon, color: 'text-gray-500' },
}

export function AddTaskModal({ isOpen, onClose, projectId, task, onTaskAdded, onTaskUpdated }: AddTaskModalProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; stages: { id: string; name: string }[] }[]>([])
  const [developers, setDevelopers] = useState<EmployeeSummary[]>([])
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    time: 0,
    efforts: 'backend',
    assignee: {} as EmployeeSummary,
    status: 'backlog',
    createdAt: new Date(),
    projectId: projectId || '',
    reporter: {} as EmployeeSummary,
    priority: 'low',
    dueDate: undefined,
    comments: [],
    stageId: '',
    type: 'task'
  })

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData(task)
        setIsEditMode(true)
      } else {
        setFormData({
          title: '',
          description: '',
          time: 0,
          efforts: 'backend',
          assignee: {} as EmployeeSummary,
          status: 'backlog',
          createdAt: new Date(),
          projectId: projectId || '',
          reporter: {} as EmployeeSummary,
          priority: 'low',
          dueDate: undefined,
          comments: [],
          stageId: '',
          type: 'task'
        })
        setIsEditMode(false)
      }
    }
  }, [task, isOpen, projectId])

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const projectsData = await fetchProjects()
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

    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User information is not available. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      if (task) {
        await updateTask({ ...formData, id: task.id } as Task, user.email)
        toast({
          title: "Success",
          description: "Task updated successfully",
        })
        onTaskUpdated?.()
      } else {
        await addTask(formData, user.email)
        toast({
          title: "Success",
          description: "New task added successfully",
        })
        onTaskAdded?.()
      }
      onClose()
    } catch (error) {
      console.error('Error processing task:', error)
      toast({
        title: "Error",
        description: `Failed to ${task ? 'update' : 'add'} task`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!user?.email || !task) {
      toast({
        title: "Error",
        description: "User information or task data is not available.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      await deleteTask(task.id, user.email)
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const taskPriorities = ['low', 'medium', 'high', 'urgent', 'critical', 'null']
  const taskTypes = ['bug', 'feature', 'documentation', 'task', 'changeRequest', 'other']

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="h-[90vh] max-w-4xl mx-auto">
        <DrawerHeader className="space-y-2">
          <div className="flex justify-between items-center">
            <DrawerTitle className="text-3xl font-bold text-gray-800">
              {task ? 'Edit Task' : 'Add New Task'}
            </DrawerTitle>
            <Button variant="outline" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
              <XIcon className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DrawerDescription className="text-gray-600">
            {task ? 'Edit the details of your task.' : 'Add a new task to your board.'}
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId" className="text-gray-700 font-semibold">
                  Project
                </Label>
                <Select
                  name="projectId"
                  value={formData.projectId}
                  onValueChange={handleProjectChange}
                  disabled={!!projectId}
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
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700 font-semibold">
                  Type
                </Label>
                <Select
                  name="type"
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Task['type'] }))}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select type">
                      {formData.type && (
                        <div className="flex items-center">
                          {React.createElement(taskTypeIcons[formData.type as keyof typeof taskTypeIcons].icon, {
                            className: `h-4 w-4 mr-2 ${taskTypeIcons[formData.type as keyof typeof taskTypeIcons].color}`
                          })}
                          <span>{formData.type}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          {React.createElement(taskTypeIcons[type as keyof typeof taskTypeIcons].icon, {
                            className: `h-4 w-4 mr-2 ${taskTypeIcons[type as keyof typeof taskTypeIcons].color}`
                          })}
                          <span>{type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                className="border-gray-300 focus:border-blue-500 h-24"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
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
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select priority">
                        {formData.priority && (
                          <div className="flex items-center">
                            {React.createElement(priorityIcons[formData.priority as keyof typeof priorityIcons].icon, {
                              className: `h-4 w-4 mr-2 ${priorityIcons[formData.priority as keyof typeof priorityIcons].color}`
                            })}
                            <span>{formData.priority}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center">
                            {React.createElement(priorityIcons[priority as keyof typeof priorityIcons].icon, {
                              className: `h-4 w-4 mr-2 ${priorityIcons[priority as keyof typeof priorityIcons].color}`
                            })}
                            <span>{priority}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
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
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map((dev) => (
                        <SelectItem key={dev.id} value={dev.name}>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={`/avatars/${dev.id}.jpg`} alt={dev.name} />
                              <AvatarFallback>{dev.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {dev.name}
                          </div>
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
          </div>
        </form>
        <DrawerFooter>
          <div className="flex justify-between w-full">
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 rounded-full" onClick={handleSubmit} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <ClockIcon className="animate-spin h-4 w-4" />
                  {task ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  {task ? 'Update' : 'Add'} Task
                </>
              )}
            </Button>

            {task && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <ClockIcon className="animate-spin h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Delete Task
                  </>
                )}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}