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
  KanbanIcon,
  ListTodoIcon,
  PlusIcon,
  UploadIcon,
  SearchIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  RefreshCw,
} from 'lucide-react'
import { Task } from '@/models/task'
import { TaskModal } from '@/components/TaskModal'
import { FileUploadModal } from '@/components/FileUploadModal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Employee, fetchEmployee } from '@/models/employee'
import { collection, onSnapshot, query } from "firebase/firestore"
import { getEffortColor, getPriorityColor } from '@/lib/colors/colors'
import { db } from "@/firebase"
import LottieLoading from '@/components/LottieLoading'

const columns = [
  { id: 'backlog', title: 'Backlog', icon: BackpackIcon, color: 'bg-background' },
  { id: 'todo', title: 'To Do', icon: ListTodoIcon, color: 'bg-background' },
  { id: 'inProgress', title: 'In Progress', icon: ActivityIcon, color: 'bg-background' },
  { id: 'done', title: 'Done', icon: CheckIcon, color: 'bg-background' },
]

const TaskItem = React.memo(({ task, index, onClick, isDraggable }: { task: Task; index: number; onClick: () => void; isDraggable: boolean }) => {
  const renderContent = (provided: any) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-md p-2 shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-200`}
      onClick={onClick}
    >
      <h3 className="font-medium text-sm mb-1 text-gray-800 line-clamp-1">{task.title}</h3>
      <p className="text-xs text-gray-600 mb-1 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-1 mb-1">
        <Badge variant="outline" className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600">
          <ClockIcon className="w-3 h-3" />
          {task.time}h
        </Badge>
        <Badge variant="outline" className={`flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 ${getEffortColor(task.efforts)}`}>
          <TagIcon className="w-3 h-3" />
          {task.efforts}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600">
          <UserIcon className="w-3 h-3" />
          {task.assignee?.name}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <Progress value={task.status === 'done' ? 100 : task.status === 'inProgress' ? 50 : task.status === 'todo' ? 25 : 0} className="h-1 w-2/3" />
        <Badge variant="secondary" className={`text-[10px] ${getPriorityColor(task.priority || 'null')}`}>
          {task.priority}
        </Badge>
      </div>
    </div>
  )

  return isDraggable ? (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => renderContent(provided)}
    </Draggable>
  ) : renderContent({})
})

TaskItem.displayName = "TaskItem";

const Column = React.memo(({ id, title, icon: Icon, color, tasks, onTaskClick, isDraggable }: {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isDraggable: boolean;
}) => {
  return (
    <Card className={`w-full md:w-72 lg:w-80 bg-white rounded-lg shadow-md`}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center">
          <Icon className="mr-2 h-4 w-4 text-gray-500" />
          {title}
          <Badge variant="secondary" className="ml-auto bg-gray-200 text-gray-700">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {isDraggable ? (
          <Droppable droppableId={id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto ${snapshot.isDraggingOver ? 'bg-gray-100' : ''} rounded-md p-1`}
              >
                {tasks.map((task, index) => (
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
          <div className="space-y-2 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto">
            {tasks.map((task, index) => (
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
      </CardContent>
    </Card>
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
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-primary shadow-md">
        <h1 className="text-lg md:text-2xl font-bold text-white flex items-center">
          <KanbanIcon className="mr-2 h-6 w-6 text-white" />
          Kanban Board
        </h1>
        <div className="flex space-x-2 md:space-x-4">
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            variant="secondary"
            size="sm"
            className="text-xs md:text-sm bg-white text-primary hover:bg-gray-100 border-none"
          >
            <UploadIcon className="mr-1 h-4 w-4" />
            Upload
          </Button>
          <Button
            onClick={() => {
              setSelectedTask(null)
              setIsModalOpen(true)
            }}
            variant="outline"
            size="sm"
            className="text-xs md:text-sm bg-white text-primary hover:bg-gray-100 border-none"
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-2 bg-white border-b space-y-2 md:space-y-0 shadow-sm">
        <div className="flex flex-wrap items-center space-x-2 md:space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-60">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-1 text-sm w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-between md:justify-start">
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
      </div>
      <main className="flex-1 overflow-auto p-2 md:p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {columns.map(({ id, title, icon, color }) => (
              <Column
                key={id}
                id={id}
                title={title}
                icon={icon}
                color={color}
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
      </main>
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
