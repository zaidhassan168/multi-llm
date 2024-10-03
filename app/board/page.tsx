'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { addTask, fetchTasksEmail, deleteTask, updateTask } from '@/models/task'
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
  ChevronDown,
ChevronUp,
} from 'lucide-react'
import { Task } from '@/models/task'
import { TaskModal } from '@/components/TaskModal'
import { FileUploadModal } from '@/components/FileUploadModal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Employee, fetchEmployee } from '@/models/employee'
import { collection, onSnapshot, query } from "firebase/firestore"
import { getEffortColor, getPriorityColor } from '@/lib/colors/colors'
import { db } from "@/firebase"
import LottieLoading from '@/components/LottieLoading'
const columns = [
  { id: 'backlog', title: 'Backlog', icon: BackpackIcon },
  { id: 'todo', title: 'To Do', icon: ListTodoIcon },
  { id: 'inProgress', title: 'In Progress', icon: ActivityIcon },
  { id: 'done', title: 'Done', icon: CheckIcon },
]

const getDueDateColor = (dueDate: Date | undefined) => {
  if (!dueDate) return 'text-gray-500'

  const today = new Date()
  const due = new Date(dueDate)

  if (due < today) return 'text-red-500'
  if (due.toDateString() === today.toDateString()) return 'text-yellow-500'
  return 'text-blue-500'
}
const formatDueDate = (dueDate: Date | undefined) => {
  if (!dueDate) return 'Not set'
  return new Date(dueDate).toLocaleDateString()
}
const TaskItem = React.memo(({ task, index, onClick, isDraggable }: { task: Task; index: number; onClick: () => void; isDraggable: boolean }) => {
  const renderContent = (provided: any) => (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="rounded-lg p-4 mb-4 cursor-pointer transition-colors duration-200 hover:bg-accent"
      nClick={onClick}
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold line-clamp-2">{task.title}</h3>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
      <div className="flex items-center text-xs text-muted-foreground">
        <CalendarIcon className={`w-3 h-3 mr-1 ${getDueDateColor(task.dueDate)}`} />
        <span>Due: {formatDueDate(task.dueDate)}</span>
      </div>
               <span>Time: {task.time}h</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`text-xs ${getEffortColor(task.efforts || '')}`}>
          {task.efforts}
        </Badge>
        {task.assignee && (
          <Badge variant="outline" className="text-xs bg-background text-foreground">
            {task.assignee.name}
          </Badge>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <div className={`${getPriorityColor(task.priority || undefined)} rounded-full w-3 h-3`} />
          <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
        </div>
      </div>
    </Card>
  )
  return isDraggable ? (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => renderContent(provided)}
    </Draggable>
  ) : renderContent({})
})

TaskItem.displayName = "TaskItem"

const Column = React.memo(({ id, title, icon: Icon, tasks, onTaskClick, isDraggable }: {
  id: string;
  title: string;
  icon: React.ElementType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isDraggable: boolean;
}) => {
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedTasks = useMemo(() => {
    if (!sortBy) return tasks

    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 0
        return sortDirection === 'asc' ? aPriority - bPriority : bPriority - aPriority
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
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('asc')
    }
  }

  return (
    <div className="bg-background rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h2>
      <div className="flex space-x-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('priority')}
          className="text-xs"
        >
          Priority {sortBy === 'priority' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('dueDate')}
          className="text-xs"
        >
          Due Date {sortBy === 'dueDate' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />)}
        </Button>
      </div>
      <div className="space-y-4">
        {isDraggable ? (
          <Droppable droppableId={id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4 min-h-[200px]"
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <div className="space-y-4 min-h-[200px]">
            {sortedTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                isDraggable={isDraggable}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
Column.displayName = "Column";

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
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
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }, [user, toast])

  useEffect(() => {
    fetchTasksData()
  }, [fetchTasksData])

  useEffect(() => {
    if (selectedTask) {
      setIsModalOpen(true)
    }
  }, [selectedTask])

  const filteredTasksMemo = useMemo(() => {
    return tasks.filter(task =>
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterEffort === 'all' || task.efforts === filterEffort) &&
      (filterAssignee === 'all' || task.assignee?.name === filterAssignee)
    )
  }, [tasks, searchTerm, filterEffort, filterAssignee])

  useEffect(() => {
    setFilteredTasks(filteredTasksMemo)
  }, [filteredTasksMemo])

  useEffect(() => {
    const q = query(collection(db, "tasks"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const updatedTask = { ...change.doc.data(), id: change.doc.id } as Task
        if (change.type === "added" || change.type === "modified") {
          setTasks((prevTasks) => {
            const existingTaskIndex = prevTasks.findIndex(task => task.id === updatedTask.id)
            if (existingTaskIndex !== -1) {
              const newTasks = [...prevTasks]
              newTasks[existingTaskIndex] = updatedTask
              return newTasks
            } else {
              return [...prevTasks, updatedTask]
            }
          })
        } else if (change.type === "removed") {
          setTasks((prevTasks) => prevTasks.filter(task => task.id !== updatedTask.id))
        }
      })
    })
    return () => unsubscribe()
  }, [])

  const handleUpdateTask = useCallback(async (taskToUpdate: Task) => {
    if (user?.email) {
      try {
        await updateTask(taskToUpdate, user.email)
        toast({
          title: "Success",
          description: "Task updated successfully.",
        })
      } catch (error) {
        console.error('Failed to update task', error)
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        })
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, status: task.status } : task))
        )
      }
    } else {
      console.error('User email is not available')
      toast({
        title: "Error",
        description: "User information is not available. Please try logging in again.",
        variant: "destructive",
      })
    }
  }, [user, toast])

  const handleDeleteTask = async (taskId: string) => {
    if (user?.email) {
      try {
        await deleteTask(taskId, user.email)
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
        toast({
          title: "Success",
          description: "Task deleted successfully.",
        })
      } catch (error) {
        console.error('Failed to delete task', error)
        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (employee?.role === 'management') {
        toast({
          title: "Access Denied",
          description: "Management role cannot drag and drop tasks.",
          variant: "destructive",
        })
        return
      }

      const { destination, source, draggableId } = result

      if (!destination) {
        return
      }

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) => {
          if (task.id === draggableId) {
            return { ...task, status: destination.droppableId as Task['status'] }
          }
          return task
        })
        return updatedTasks
      })

      const taskToUpdate = tasks.find(task => task.id === draggableId)
      if (taskToUpdate && taskToUpdate.status !== destination.droppableId) {
        const updatedTask = { ...taskToUpdate, status: destination.droppableId as Task['status'] }
        handleUpdateTask(updatedTask)
      }
    },
    [tasks, handleUpdateTask, employee, toast]
  )

  const uniqueAssignees = useMemo(() => {
    const assignees = tasks.map(task => task.assignee?.name).filter((name): name is string => Boolean(name))
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
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      {isFilterOpen && (
        <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mb-4">
          <div className="relative flex-1 md:flex-none md:w-60">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 text-sm w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterEffort} onValueChange={setFilterEffort}>
            <SelectTrigger className="w-36 md:w-48 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="Effort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All efforts</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="backend + frontend">Full Stack</SelectItem>
            </SelectContent>
          </Select>
          {(employee?.role === 'management' || employee?.role === 'projectManager') && (
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-36 md:w-48 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee === 'all' ? 'All assignees' : assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" onClick={fetchTasksData} size="sm" className="text-xs md:text-sm text-gray-600 hover:text-primary">
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
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
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {columns.map(({ id, title, icon }) => (
            <Column
              key={id}
              id={id}
              title={title}
              icon={icon}
              tasks={filteredTasks.filter(task => task.status === id)}
              onTaskClick={(task) => {
                setSelectedTask(task)
                setIsModalOpen(true)
              }}
              isDraggable={isDraggable}
            />
          ))}
        </div>
      </DragDropContext>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
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