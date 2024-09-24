'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { fetchTasksEmail, updateTask, Task } from '@/models/task'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import TaskListItem from '@/components/tasks/TaskListItem'
import {
  SearchIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  SendIcon,
  Loader2Icon,
  CalendarIcon,
  MessageSquareIcon,
  MoreVerticalIcon
} from 'lucide-react'

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
        <Loader2Icon className="animate-spin h-8 w-8 text-primary" />
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
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-1/3 p-4 overflow-auto border-r">
        <div className="mb-4">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-8 pr-2 py-1 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <TaskListItem
              key={task.id}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      </div>
      <div className="w-2/3 p-4 bg-background overflow-auto">
        {selectedTask ? (
          <Card className="h-full overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>{selectedTask.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <p className="text-sm text-muted-foreground mb-4">{selectedTask.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {selectedTask.time}h
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  {selectedTask.efforts}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {selectedTask.assignee?.name}
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">Comments</h3>
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {selectedTask.comments?.map(comment => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
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
                  className="flex-grow"
                  rows={2}
                />
                <Button onClick={handleAddComment} size="icon">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a task to view details
          </div>
        )}
      </div>
    </div>
  )
}