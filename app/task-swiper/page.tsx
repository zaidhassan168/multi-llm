'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task, fetchTasksEmail, updateTask } from '@/models/task'
import { RefreshCw, ChevronUpIcon, ChevronDownIcon, Inbox, ListTodo, Activity, CheckCircle, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Employee, fetchEmployee } from '@/models/employee'

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
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const [employee, setEmployee] = useState<Employee | null>(null)

  const fetchTasks = useCallback(async () => {
    if (user?.email) {
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
    setSwipeDirection('up')
    setCurrentTaskIndex(prevIndex =>
      prevIndex < tasks.length - 1 ? prevIndex + 1 : prevIndex
    )
  }

  const moveToPreviousTask = () => {
    setSwipeDirection('down')
    setCurrentTaskIndex(prevIndex =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    )
  }

  const handlers = useSwipeable({
    onSwipedUp: moveToNextTask,
    onSwipedDown: moveToPreviousTask,
    preventScrollOnSwipe: true,
    trackMouse: true
  })

  const currentTask = tasks[currentTaskIndex]

  if (!currentTask) {
    return <div className="flex justify-center items-center h-screen">No tasks available</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-md h-screen flex flex-col relative">
      <h1 className="text-2xl font-bold mb-4 text-center">Task Swiper</h1>

      {/* Left and Right icons for computer screens */}
      <div className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2">
        <Button size="icon" onClick={moveToPreviousTask}>
          <ChevronLeftIcon className="h-6 w-6" />
        </Button>
      </div>
      <div className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2">
        <Button size="icon" onClick={moveToNextTask}>
          <ChevronRightIcon className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-grow flex items-center justify-center mb-4 relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentTask.id}
            initial={{ opacity: 0, scale: 0.8, y: swipeDirection === 'up' ? 300 : -300 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: swipeDirection === 'up' ? -300 : 300
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.2 }}
            {...handlers}
            className="cursor-grab active:cursor-grabbing w-full max-w-sm"
            onAnimationComplete={() => setSwipeDirection(null)}
          >
            <Card
              className="border-4 shadow-lg"
              style={{
                borderColor: currentTask.priority
                  ? priorityColors[currentTask.priority as keyof typeof priorityColors].split(' ')[1].replace('text-', '')
                  : '#d1d5db', // Muted gray fallback (bg-gray-300)
              }}
            >
              <CardHeader>
                <CardTitle className="text-xl">{currentTask.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">{currentTask.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge>{currentTask.efforts}</Badge>
                  <Badge variant="outline">{currentTask.time}h</Badge>
                  <Badge className={priorityColors[currentTask.priority as keyof typeof priorityColors]}>
                    {currentTask.priority}
                  </Badge>
                </div>

                <div className="flex justify-center space-x-2 mb-4">
                  {Object.keys(priorityColors).map((priority) => (
                    <Button
                      key={priority}
                      onClick={() => handlePriorityChange(priority as Task['priority'])}
                      size="sm"
                      className={priorityColors[priority as keyof typeof priorityColors]}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-gray-500">Assignee: {currentTask.assignee.name}</p>
                <p className="text-sm font-semibold mt-2">Status: {currentTask.status}</p>
              </CardContent>

            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Status Buttons */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {statusOrder.map((status) => {
            const IconComponent = statusIcons[status as keyof typeof statusIcons]
            return (
              <div key={status} className="flex flex-col items-center">
                <Button
                  onClick={() => handleStatusChange(status as Task['status'])}
                  size="icon"
                  className={`rounded-full p-2 mb-1 ${statusColors[status as keyof typeof statusColors]}`}
                >
                  <IconComponent className="h-6 w-6 text-white" />
                  <span className="sr-only">{status}</span>
                </Button>
                <span className={`text-xs font-medium capitalize ${statusTextColors[status as keyof typeof statusTextColors]}`}>
                  {status.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="text-center text-gray-500 text-sm mb-4">
        Swipe up for next task, down for previous task
      </div>
      <div className="flex justify-between mb-4">
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
          {showTaskList ? <ChevronUpIcon className="mr-2" /> : <ChevronDownIcon className="mr-2" />}
          {showTaskList ? 'Hide List' : 'Show List'}
        </Button>
      </div>
      <AnimatePresence>
        {showTaskList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-auto max-h-60"
          >
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer ${index === currentTaskIndex ? 'border-blue-500 border-2' : ''}`}
                  onClick={() => setCurrentTaskIndex(index)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{task.title}</CardTitle>
                    <div className="flex justify-between items-center mt-1">
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">{task.status}</span>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
