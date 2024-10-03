'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  addTask,
  fetchTasksEmail,
  deleteTask,
  updateTask,
} from '@/models/task'
import {
  ActivityIcon,
  BackpackIcon,
  CheckIcon,
  ListTodoIcon,
  PlusIcon,
  UploadIcon,
  SearchIcon,
  RefreshCw,
  FilterIcon,
  CalendarIcon,
  AlertTriangle,
  Calendar,
} from 'lucide-react'
import { Task } from '@/models/task'
import { TaskModal } from '@/components/TaskModal'
import { FileUploadModal } from '@/components/FileUploadModal'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Employee, fetchEmployee } from '@/models/employee'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { getEffortColor, getPriorityColor, getDueDateColor } from '@/lib/colors/colors'
import { db } from '@/firebase'
import LottieLoading from '@/components/LottieLoading'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Define Kanban columns
const columns = [
  { id: 'backlog', title: 'Backlog', icon: BackpackIcon },
  { id: 'todo', title: 'To Do', icon: ListTodoIcon },
  { id: 'inProgress', title: 'In Progress', icon: ActivityIcon },
  { id: 'done', title: 'Done', icon: CheckIcon },
]


const formatDueDate = (dueDate?: Date) => {
  if (!dueDate) return 'Not set'
  return new Date(dueDate).toLocaleDateString()
}

// TaskItem Component
const TaskItem = React.memo(
  ({
    task,
    index,
    onClick,
    isDraggable,
  }: {
    task: Task
    index: number
    onClick: () => void
    isDraggable: boolean
  }) => {
    const content = (
      <Card
        className="rounded-lg p-4 mb-4 cursor-pointer transition-colors duration-200 hover:bg-accent"
        onClick={onClick}
      >
        <div className="mb-2">
          <h3 className="text-sm font-semibold line-clamp-2">{task.title}</h3>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center">
            <CalendarIcon
              className={`w-3 h-3 mr-1 ${getDueDateColor(task.dueDate)}`}
            />
            <span>Due: {formatDueDate(task.dueDate)}</span>
          </div>
          <span>Time: {task.time}h</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-xs ${getEffortColor(task.efforts || '')}`}
          >
            {task.efforts}
          </Badge>
          {task.assignee && (
            <Badge variant="outline" className="text-xs bg-background">
              {task.assignee.name}
            </Badge>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <div
              className={`${
                getPriorityColor(task.priority || undefined)
              } rounded-full w-3 h-3`}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {task.priority}
            </span>
          </div>
        </div>
      </Card>
    )

    return isDraggable ? (
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {content}
          </div>
        )}
      </Draggable>
    ) : (
      content
    )
  }
)

TaskItem.displayName = 'TaskItem'

// Column Component
const Column = React.memo(
  ({
    id,
    title,
    icon: Icon,
    tasks,
    onTaskClick,
    isDraggable,
  }: {
    id: string
    title: string
    icon: React.ElementType
    tasks: Task[]
    onTaskClick: (task: Task) => void
    isDraggable: boolean
  }) => {
    const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
      'asc'
    )

    const sortedTasks = useMemo(() => {
      if (!sortBy) return tasks

      return [...tasks].sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const aPriority =
            priorityOrder[
              (a.priority?.toLowerCase() as keyof typeof priorityOrder) ||
                'low'
            ]
          const bPriority =
            priorityOrder[
              (b.priority?.toLowerCase() as keyof typeof priorityOrder) ||
                'low'
            ]
          return sortDirection === 'asc'
            ? aPriority - bPriority
            : bPriority - aPriority
        } else if (sortBy === 'dueDate') {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
        }
        return 0
      })
    }, [tasks, sortBy, sortDirection])

    const toggleSort = (newSortBy: 'priority' | 'dueDate') => {
      if (sortBy === newSortBy) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(newSortBy)
        setSortDirection('asc')
      }
    }

    return (
      <div className="bg-background rounded-lg shadow-lg p-4 sm:p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Icon className="mr-2 h-5 w-5" />
            {title}
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSort('priority')}
              className={`p-1 ${
                sortBy === 'priority' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-label="Sort by priority"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSort('dueDate')}
              className={`p-1 ${
                sortBy === 'dueDate' ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-label="Sort by due date"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Droppable droppableId={id}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...(isDraggable ? provided.droppableProps : {})}
              className="flex-1 overflow-auto"
            >
              {sortedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick(task)}
                  isDraggable={isDraggable}
                />
              ))}
              {isDraggable && provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    )
  }
)

Column.displayName = 'Column'

// Main Kanban Component
export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEffort, setFilterEffort] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const { user } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Fetch tasks and employee data
  const fetchTasksData = useCallback(async () => {
    if (user?.email) {
      try {
        setIsLoading(true)
        const emp = await fetchEmployee(user.email)
        setEmployee(emp)
        const tasksData = await fetchTasksEmail(user.email, emp.role)
        setTasks(tasksData)
      } catch (error) {
        console.error('Failed to load tasks', error)
        toast({
          title: 'Error',
          description: 'Failed to load tasks. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, toast])

  useEffect(() => {
    fetchTasksData()
  }, [fetchTasksData])

  // Open modal when a task is selected
  useEffect(() => {
    if (selectedTask) {
      setIsModalOpen(true)
    }
  }, [selectedTask])

  // Real-time updates with Firebase
  useEffect(() => {
    const q = query(collection(db, 'tasks'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const updatedTask = { ...change.doc.data(), id: change.doc.id } as Task
        if (change.type === 'added' || change.type === 'modified') {
          setTasks((prevTasks) => {
            const existingTaskIndex = prevTasks.findIndex(
              (task) => task.id === updatedTask.id
            )
            if (existingTaskIndex !== -1) {
              const newTasks = [...prevTasks]
              newTasks[existingTaskIndex] = updatedTask
              return newTasks
            } else {
              return [...prevTasks, updatedTask]
            }
          })
        } else if (change.type === 'removed') {
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== updatedTask.id)
          )
        }
      })
    })
    return () => unsubscribe()
  }, [])

  // Handle task updates
  const handleUpdateTask = useCallback(
    async (taskToUpdate: Task) => {
      if (user?.email) {
        try {
          await updateTask(taskToUpdate, user.email)
          toast({
            title: 'Success',
            description: 'Task updated successfully.',
          })
        } catch (error) {
          console.error('Failed to update task', error)
          toast({
            title: 'Error',
            description: 'Failed to update task. Please try again.',
            variant: 'destructive',
          })
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskToUpdate.id
                ? { ...task, status: task.status }
                : task
            )
          )
        }
      } else {
        console.error('User email is not available')
        toast({
          title: 'Error',
          description:
            'User information is not available. Please try logging in again.',
          variant: 'destructive',
        })
      }
    },
    [user, toast]
  )

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (user?.email) {
      try {
        await deleteTask(taskId, user.email)
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        )
        toast({
          title: 'Success',
          description: 'Task deleted successfully.',
        })
      } catch (error) {
        console.error('Failed to delete task', error)
        toast({
          title: 'Error',
          description: 'Failed to delete task. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  // Handle drag and drop
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (employee?.role === 'management') {
        toast({
          title: 'Access Denied',
          description: 'Management role cannot drag and drop tasks.',
          variant: 'destructive',
        })
        return
      }

      const { destination, source, draggableId } = result

      if (!destination) return

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggableId
            ? { ...task, status: destination.droppableId as Task['status'] }
            : task
        )
      )

      const taskToUpdate = tasks.find((task) => task.id === draggableId)
      if (
        taskToUpdate &&
        taskToUpdate.status !== destination.droppableId
      ) {
        const updatedTask = {
          ...taskToUpdate,
          status: destination.droppableId as Task['status'],
        }
        handleUpdateTask(updatedTask)
      }
    },
    [tasks, handleUpdateTask, employee, toast]
  )

  // Filtered tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        (filterEffort === 'all' || task.efforts === filterEffort) &&
        (filterAssignee === 'all' ||
          task.assignee?.name === filterAssignee)
    )
  }, [tasks, searchTerm, filterEffort, filterAssignee])

  // Unique assignees for filter options
  const uniqueAssignees = useMemo(() => {
    const assignees = tasks
      .map((task) => task.assignee?.name)
      .filter((name): name is string => Boolean(name))
    return ['all', ...Array.from(new Set(assignees))]
  }, [tasks])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LottieLoading size="large" />
      </div>
    )
  }

  const isDraggable = employee?.role !== 'management'

  return (
    <div className="flex flex-col h-full bg-muted/40 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Kanban Board</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTask(null)
              setIsModalOpen(true)
            }}
            aria-label="Add Task"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            aria-label="Upload Tasks"
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="Filter Tasks"
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mb-4">
          {/* Search Input */}
          <div className="relative flex-1 md:flex-none md:w-60">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 text-sm w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search Tasks"
            />
          </div>

          {/* Effort Filter */}
          <Select
            value={filterEffort}
            onValueChange={setFilterEffort}
            aria-label="Filter by Effort"
          >
            <SelectTrigger className="w-36 md:w-48 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="Effort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Efforts</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="full-stack">Full Stack</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee Filter */}
          {(employee?.role === 'management' ||
            employee?.role === 'projectManager') && (
            <Select
              value={filterAssignee}
              onValueChange={setFilterAssignee}
              aria-label="Filter by Assignee"
            >
              <SelectTrigger className="w-36 md:w-48 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee === 'all' ? 'All Assignees' : assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            onClick={fetchTasksData}
            size="sm"
            className="text-xs md:text-sm text-gray-600 hover:text-primary"
            aria-label="Refresh Tasks"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>

          {/* Task Count Badges */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
              Total: {tasks.length}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
              Filtered: {filteredTasks.length}
            </Badge>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {columns.map(({ id, title, icon }) => (
            <Column
              key={id}
              id={id}
              title={title}
              icon={icon}
              tasks={filteredTasks.filter((task) => task.status === id)}
              onTaskClick={(task) => {
                setSelectedTask(task)
                setIsModalOpen(true)
              }}
              isDraggable={isDraggable}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        onTaskAdded={fetchTasksData}
        onTaskUpdated={fetchTasksData}
      />
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  )
}
