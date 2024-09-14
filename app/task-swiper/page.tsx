'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task, fetchTasksEmail, updateTask } from '@/models/task'
import { RefreshCw, ChevronLeftIcon, ChevronRightIcon, Inbox, ListTodo, Activity, CheckCircle } from 'lucide-react'
import { Employee, fetchEmployee } from '@/models/employee'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'

const statusOrder = ['backlog', 'todo', 'inProgress', 'done']

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-purple-100 text-purple-800',
}

const statusColors = {
  backlog: 'bg-gray-500 hover:bg-gray-600',
  todo: 'bg-blue-500 hover:bg-blue-600',
  inProgress: 'bg-yellow-500 hover:bg-yellow-600',
  done: 'bg-green-500 hover:bg-green-600',
}

const statusTextColors = {
  backlog: 'text-gray-600',
  todo: 'text-blue-600',
  inProgress: 'text-yellow-600',
  done: 'text-green-600',
}

const statusIcons = {
  backlog: Inbox,
  todo: ListTodo,
  inProgress: Activity,
  done: CheckCircle,
}

export default function TaskSwiper() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [showTaskList, setShowTaskList] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (user?.email) {
      setLoading(true)
      try {
        const emp = await fetchEmployee(user.email)
        setEmployee(emp)
        const fetchedTasks = await fetchTasksEmail(user.email, emp.role)
        setTasks(fetchedTasks)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch tasks. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }, [user, toast])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (tasks[currentTaskIndex]) {
      const updatedTask = { ...tasks[currentTaskIndex], status: newStatus }
      try {
        await updateTask(updatedTask, user?.email || '')
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        )
        toast({
          title: 'Success',
          description: `Task status updated to ${newStatus}`,
        })
      } catch (error) {
        console.error('Failed to update task status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update task status. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    if (tasks[currentTaskIndex]) {
      const updatedTask = { ...tasks[currentTaskIndex], priority: newPriority }
      try {
        await updateTask(updatedTask, user?.email || '')
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        )
        toast({
          title: 'Success',
          description: `Task priority updated to ${newPriority}`,
        })
      } catch (error) {
        console.error('Failed to update task priority:', error)
        toast({
          title: 'Error',
          description: 'Failed to update task priority. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }

  const moveToNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prevIndex => prevIndex + 1)
    }
  }

  const moveToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prevIndex => prevIndex - 1)
    }
  }

  const currentTask = tasks[currentTaskIndex]

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600">Loading tasks...</p>
      </div>
    )
  }

  if (!currentTask) {
    return <div className="flex justify-center items-center h-screen text-lg">No tasks available</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-xl h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-center">My Tasks</h1>

      {/* Task Stats */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Task Overview</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-600">Total: {taskStats.total}</p>
            <p className="text-sm text-gray-600">To Do: {taskStats.todo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">In Progress: {taskStats.inProgress}</p>
            <p className="text-sm text-gray-600">Done: {taskStats.done}</p>
          </div>
        </div>
        <Progress 
          value={(taskStats.done / taskStats.total) * 100} 
          className="mt-2 h-2"
        />
      </div>

      {/* Navigation Buttons and Task Card */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          onClick={moveToPreviousTask} 
          disabled={currentTaskIndex === 0}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTaskIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-grow mx-4"
          >
            <Card 
              key={currentTask.id} 
              className="border-0 shadow-md bg-white dark:bg-gray-800"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xl font-bold">{currentTask.title}</CardTitle>
                <Badge className={`${priorityColors[currentTask.priority as keyof typeof priorityColors]} text-sm`}>
                  {currentTask.priority}
                </Badge>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="h-28 overflow-y-auto text-sm">
                  <p className="mb-3 text-gray-600 dark:text-gray-300">{currentTask.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">{currentTask.efforts}</Badge>
                  <Badge variant="outline" className="text-sm">{currentTask.time}h</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assignee: {currentTask.assignee.name}</p>
                <p className="text-sm font-semibold mt-2">Status: {currentTask.status}</p>
              </CardContent>
              <CardFooter className="flex justify-between px-4 py-3">
                <div className="flex space-x-2">
                  {Object.keys(priorityColors).map((priority) => (
                    <Button
                      key={priority}
                      onClick={() => handlePriorityChange(priority as Task['priority'])}
                      size="sm"
                      variant="outline"
                      className={`${priorityColors[priority as keyof typeof priorityColors]} border-none text-xs px-2 py-1`}
                    >
                      {priority.charAt(0).toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <Button 
          onClick={moveToNextTask} 
          disabled={currentTaskIndex === tasks.length - 1}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Status Buttons */}
      <div className="flex justify-center space-x-3 mb-4">
        {statusOrder.map((status) => {
          const IconComponent = statusIcons[status as keyof typeof statusIcons]
          return (
            <div key={status} className="flex flex-col items-center">
              <Button
                onClick={() => handleStatusChange(status as Task['status'])}
                size="icon"
                className={`rounded-full p-2 mb-1 ${statusColors[status as keyof typeof statusColors]}`}
              >
                <IconComponent className="h-5 w-5 text-white" />
                <span className="sr-only">{status}</span>
              </Button>
              <span className={`text-xs font-medium capitalize ${statusTextColors[status as keyof typeof statusTextColors]}`}>
                {status.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between mt-auto">
        <Button
          onClick={fetchTasks}
          variant="outline"
          size="sm"
          className="flex-1 mr-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button
          onClick={() => setShowTaskList(!showTaskList)}
          className="flex-1 ml-2"
          variant="outline"
        >
          {showTaskList ? 'Hide List' : 'Show List'}
        </Button>
      </div>

      {/* Scrollable Task List */}
      {showTaskList && (
        <ScrollArea className="mt-4 h-48 rounded-md border">
          <div className="p-4 space-y-2">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 ${
                    task.id === currentTask.id
                      ? 'border-blue-500 border-2 shadow-md' 
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => setCurrentTaskIndex(index)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{task.title}</CardTitle>
                    <div className="flex justify-between items-center mt-1">
                      <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-xs px-1 py-0`}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">{task.status}</span>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}