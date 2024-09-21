'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { fetchTasksEmail, updateTask, Task } from '@/models/task'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import {
  SearchIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  SendIcon,
  Loader2Icon
} from 'lucide-react'

const TaskItem = React.memo(({ task, isSelected, onClick }: { task: Task; isSelected: boolean; onClick: () => void }) => {
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'backend': return 'bg-purple-200 text-purple-800'
      case 'frontend': return 'bg-pink-200 text-pink-800'
      case 'backend + frontend': return 'bg-indigo-200 text-indigo-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'border-l-green-500'
      case 'medium': return 'border-l-yellow-500'
      case 'high': return 'border-l-red-500'
      case 'urgent': return 'border-l-red-500'
      case 'critical': return 'border-l-red-500'
      default: return 'border-l-gray-400'
    }
  }

  return (
    <div
      className={`bg-white rounded-lg p-2 shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 ${getPriorityColor(task.priority || 'null')} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onClick}
    >
      <h3 className="font-semibold text-sm mb-1 truncate">{task.title}</h3>
      <div className="flex flex-wrap gap-1 mb-1">
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <ClockIcon className="w-2 h-2" />
          {task.time}h
        </Badge>
        <Badge variant="secondary" className={`flex items-center gap-1 text-xs ${getEffortColor(task.efforts)}`}>
          <TagIcon className="w-2 h-2" />
          {task.efforts}
        </Badge>
      </div>
      <Progress value={task.status === 'done' ? 100 : task.status === 'inProgress' ? 50 : task.status === 'todo' ? 25 : 0} className="h-1" />
    </div>
  )
})

TaskItem.displayName = "TaskItem"

export default function TaskListView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchTasksData = useCallback(async () => {
    if (user?.email) {
      try {
        setIsLoading(true)
        const tasksData = await fetchTasksEmail(user.email, 'developer')
        setTasks(tasksData)
        setFilteredTasks(tasksData)
        setError(null)
      } catch (error) {
        console.error('Failed to load tasks', error)
        setError('Failed to load tasks. Please try again.')
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
    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTasks(filtered)
  }, [tasks, searchTerm])

  const handleAddComment = async () => {
    if (selectedTask && newComment.trim() !== '') {
      const updatedTask = {
        ...selectedTask,
        comments: [
          ...(selectedTask.comments || []),
          {
            id: Date.now().toString(),
            content: newComment,
            author: user?.displayName || 'Anonymous',
            createdAt: new Date(),
            taskId: selectedTask.id,
          }
        ]
      }
      try {
        await updateTask(updatedTask, user?.email || '')
        setSelectedTask(updatedTask)
        setNewComment('')
        setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task))
        toast({
          title: "Success",
          description: "Comment added successfully.",
        })
      } catch (error) {
        console.error('Failed to add comment', error)
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-lg font-semibold">Loading tasks...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg font-semibold text-red-500">Error loading tasks: {error}</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="w-1/3 p-2 overflow-auto">
        <div className="mb-2">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-8 pr-2 py-1 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      </div>
      <div className="w-2/3 p-2 bg-white overflow-auto">
        {selectedTask ? (
          <Card className="h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedTask.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <p className="text-sm text-gray-600 mb-2">{selectedTask.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <ClockIcon className="w-3 h-3" />
                  {selectedTask.time}h
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <TagIcon className="w-3 h-3" />
                  {selectedTask.efforts}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <UserIcon className="w-3 h-3" />
                  {selectedTask.assignee?.name}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">Comments</h3>
              <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                {selectedTask.comments?.map(comment => (
                  <div key={comment.id} className="flex space-x-2 text-sm">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-grow text-sm"
                  rows={2}
                />
                <Button onClick={handleAddComment} size="sm">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a task to view details
          </div>
        )}
      </div>
    </div>
  )
}