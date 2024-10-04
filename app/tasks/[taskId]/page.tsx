'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Task,
  fetchTask,
  updateTask,
  updateTaskComments,
  Comment,
} from '@/models/task'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  BugIcon,
  CalendarIcon,
  CheckSquare,
  FileTextIcon,
  FlagIcon,
  HelpCircle,
  LightbulbIcon,
  RefreshCcw,
  PencilIcon,
  SaveIcon,
  Loader2,
  InfoIcon,
  SmileIcon, // Added SmileIcon for reaction button
} from 'lucide-react'
import { fetchEmployees, Employee } from '@/models/employee'
import { storeCommentNotification } from '@/utils/storeNotifications'
import LottieLoading from '@/components/LottieLoading'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip' // Ensure correct import path

// Define the Reaction Emojis you want to support
const reactionEmojis = ['👍', '❤️', '😂', '🎉', '😢', '👏']

const taskPriorities = ['low', 'medium', 'high', 'urgent', 'critical', 'null']
const taskTypes = ['bug', 'feature', 'documentation', 'task', 'changeRequest', 'other']
const taskComplexities = ['simple', 'moderate', 'complex']
const taskStatuses = ['backlog', 'todo', 'inProgress', 'done']
const taskEfforts = ['backend', 'frontend', 'backend + frontend']

const priorityIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  low: { icon: FlagIcon, color: 'text-green-500' },
  medium: { icon: AlertCircle, color: 'text-yellow-500' },
  high: { icon: AlertTriangle, color: 'text-orange-500' },
  urgent: { icon: AlertOctagon, color: 'text-red-500' },
  critical: { icon: Bell, color: 'text-purple-500' },
  null: { icon: HelpCircle, color: 'text-gray-500' },
}

const taskTypeIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  bug: { icon: BugIcon, color: 'text-red-500' },
  feature: { icon: LightbulbIcon, color: 'text-yellow-500' },
  documentation: { icon: FileTextIcon, color: 'text-blue-500' },
  task: { icon: CheckSquare, color: 'text-green-500' },
  changeRequest: { icon: RefreshCcw, color: 'text-purple-500' },
  other: { icon: HelpCircle, color: 'text-gray-500' },
}

export default function TaskView() {
  const { taskId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newComment, setNewComment] = useState('')
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const mentionRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempEditValues, setTempEditValues] = useState<Partial<Task>>({})
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Fetch Task and Employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [taskData, employeesData] = await Promise.all([
          fetchTask(taskId as string),
          fetchEmployees(),
        ])
        setTask(taskData)
        setEmployees(employeesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load task data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (taskId) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]) // Removed 'toast' from dependencies

  // Handle Click Outside for Mentions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(event.target as Node)) {
        setShowMentions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle Field Changes
  const handleChange = useCallback(
    async (field: keyof Task, value: any) => {
      if (!task || !user?.email) return

      const updatedTask = { ...task, [field]: value }
      setTask(updatedTask)

      try {
        await updateTask(updatedTask, user.email)
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        })
      } catch (error) {
        console.error('Error updating task:', error)
        toast({
          title: 'Error',
          description: 'Failed to update task',
          variant: 'destructive',
        })
      }
    },
    [task, user?.email, toast]
  )

  // Handle Adding Comments
  const handleAddComment = useCallback(async () => {
    if (task && newComment.trim() !== '') {
      setIsAddingComment(true)
      const mentionedUsers = newComment.match(/@(\w+)/g)?.map((mention) => mention.slice(1)) || []

      const authorName = user?.displayName || user?.email || 'Anonymous'

      const newCommentData: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: authorName,
        createdAt: new Date(),
        taskId: task.id,
        reactions: {},
        mentions: mentionedUsers,
      }

      const updatedTask = {
        ...task,
        comments: [...(task.comments || []), newCommentData] as Comment[],
      }
      try {
        await updateTaskComments(task.id, updatedTask.comments, user?.email || '')
        setTask(updatedTask)
        setNewComment('')
        toast({
          title: 'Success',
          description: 'Comment added successfully.',
        })
        await storeCommentNotification(
          task.id,
          task.title,
          newCommentData.id,
          user?.uid || '',
          authorName,
          newComment,
          mentionedUsers,
          employees
        )
      } catch (error) {
        console.error('Failed to add comment', error)
        toast({
          title: 'Error',
          description: 'Failed to add comment. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsAddingComment(false)
      }
    }
  }, [task, newComment, user, employees, toast])

  // Handle Mention Selection
  const handleMention = useCallback(
    (employee: Employee) => {
      const commentWords = newComment.split(' ')
      const lastWord = commentWords[commentWords.length - 1]
      const newCommentText =
        newComment.slice(0, newComment.length - lastWord.length) + `@${employee.name} `
      setNewComment(newCommentText)
      setShowMentions(false)
    },
    [newComment]
  )

  // Handle Comment Input Change
  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewComment(e.target.value)
      const words = e.target.value.split(' ')
      const lastWord = words[words.length - 1]
      if (lastWord.startsWith('@')) {
        setMentionSearch(lastWord.slice(1))
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    },
    []
  )

  // Handle Editing Fields
  const handleEditField = useCallback((field: string) => {
    setEditingField(field)
    setTempEditValues({ ...tempEditValues, [field]: task?.[field as keyof Task] })
  }, [tempEditValues, task])

  const handleSaveField = useCallback(
    async (field: keyof Task) => {
      if (task && tempEditValues[field] !== undefined) {
        await handleChange(field, tempEditValues[field])
        setEditingField(null)
      }
    },
    [handleChange, task, tempEditValues]
  )

  const handleInputChange = useCallback(
    (field: keyof Task, value: any) => {
      setTempEditValues({ ...tempEditValues, [field]: value })
    },
    [tempEditValues]
  )

  // Handle Reactions
  const handleReaction = useCallback(
    async (commentId: string, emoji: string) => {
      if (!task || !user?.email) return

      const updatedComments = task.comments?.map((comment) => {
        if (comment.id === commentId) {
          const users = comment.reactions[emoji] || []
          const userIdentifier = user.displayName || user.email || ''

          if (users.includes(userIdentifier)) {
            // Remove reaction
            return {
              ...comment,
              reactions: {
                ...comment.reactions,
                [emoji]: users.filter((u) => u !== userIdentifier),
              },
            }
          } else {
            // Add reaction
            return {
              ...comment,
              reactions: {
                ...comment.reactions,
                [emoji]: [...users, userIdentifier],
              },
            }
          }
        }
        return comment
      })

      const updatedTask = { ...task, comments: updatedComments } as Task
      setTask(updatedTask)

      try {
        await updateTaskComments(task.id, updatedTask.comments || [], user.email)
        toast({
          title: 'Success',
          description: 'Reaction updated successfully',
        })
      } catch (error) {
        console.error('Error updating reaction:', error)
        toast({
          title: 'Error',
          description: 'Failed to update reaction',
          variant: 'destructive',
        })
      }
    },
    [task, user?.email, toast]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LottieLoading size="large" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <InfoIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="text-xl font-semibold">Task not found</h2>
          <p className="mt-2 text-gray-600">The task you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-grow">
            {/* Task Card */}
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {React.createElement(taskTypeIcons[task.type || 'other'].icon, {
                    className: `h-6 w-6 ${taskTypeIcons[task.type || 'other'].color}`,
                    'aria-hidden': true,
                  })}
                  {editingField === 'title' ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={tempEditValues.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="text-2xl font-bold"
                        aria-label="Edit Task Title"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveField('title')
                          }
                        }}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleSaveField('title')}
                            size="sm"
                            aria-label="Save Title"
                            disabled={!tempEditValues.title || tempEditValues.title.trim() === ''}
                          >
                            <SaveIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Save Title
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <span>{task.title}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleEditField('title')}
                            size="sm"
                            variant="ghost"
                            aria-label="Edit Title"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Edit Title
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  {editingField === 'description' ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        id="description"
                        value={tempEditValues.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                        aria-label="Edit Description"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSaveField('description')
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleSaveField('description')}
                          size="sm"
                          aria-label="Save Description"
                          disabled={
                            !tempEditValues.description ||
                            tempEditValues.description.trim() === ''
                          }
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingField(null)}
                          size="sm"
                          variant="ghost"
                          aria-label="Cancel Editing Description"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="flex-grow whitespace-pre-wrap">{task.description}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleEditField('description')}
                            size="sm"
                            variant="ghost"
                            aria-label="Edit Description"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Edit Description
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="mt-8 border-none">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => {
                      // Extract user's reactions
                      const userReactions = Object.keys(comment.reactions).filter((emoji) =>
                        comment.reactions[emoji].includes(user?.uid || user?.email || '')
                      )

                      return (
                        <div
                          key={comment.id}
                          className="flex space-x-3 p-2 transition duration-200"
                        >
                          <Avatar>
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">{comment.author}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'PPp')}
                              </p>
                            </div>
                            <p className="mt-1 text-sm">{comment.content}</p>
                            {/* User's Reactions */}
                            {Object.entries(comment.reactions || {}).map(([emoji, users]) => (
                              <Tooltip key={emoji}>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon"
                                    variant="outline"
                                    className="cursor-pointer hover:bg-secondary transition-colors"
                                    onClick={() => handleReaction(comment.id, emoji)}
                                  >
                                    {emoji} {users.length}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="top" 
                                  className="z-50 bg-popover text-popover-foreground shadow-md p-2 rounded-md"
                                >
                                  <p>{users.join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {/* Smile Icon for Adding/Removing Reactions */}
                            <div className="flex items-center mt-2 space-x-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Add Reaction"
                                    className="p-1"
                                  >
                                    <SmileIcon className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="flex space-x-2 p-2">
                                  {reactionEmojis.map((emoji) => {
                                    const users = comment.reactions[emoji] || []
                                    const userIdentifier = user?.displayName || user?.email || ''
                                    const hasReacted = users.includes(userIdentifier)

                                    // Map userIdentifiers to user names
                                    const userNames = users
                                      .map((id) => employees.find(emp => emp.email === id)?.name || id)
                                      .join(', ')

                                    return (
                                      <Tooltip key={emoji}>
                                        <TooltipTrigger asChild>
                                          <button
                                            className={`text-xl focus:outline-none ${
                                              hasReacted ? 'text-blue-600' : 'text-gray-600'
                                            }`}
                                            onClick={() => handleReaction(comment.id, emoji)}
                                            aria-label={`${hasReacted ? 'Remove' : 'Add'} reaction ${emoji}`}
                                          >
                                            {emoji}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          {hasReacted ? 'Remove your reaction' : `React with ${emoji}`}
                                          {users.length > 0 && (
                                            <>
                                              <br />
                                              <span className="text-xs">Reacted by: {userNames}</span>
                                            </>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-center text-gray-500">No comments yet.</p>
                  )}
                </div>
                <div className="flex space-x-3 mt-4">
                  <Avatar>
                    <AvatarFallback>
                      {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={handleCommentChange}
                      rows={3}
                      aria-label="Add a comment"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (!isAddingComment && newComment.trim() !== '') {
                            handleAddComment()
                          }
                        }
                      }}
                    />
                    {showMentions && (
                      <div
                        ref={mentionRef}
                        className="absolute z-10 mt-1 w-full max-h-40 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg"
                      >
                        {employees
                          .filter((emp) =>
                            emp.name.toLowerCase().includes(mentionSearch.toLowerCase())
                          )
                          .map((emp) => (
                            <div
                              key={emp.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                              onClick={() => handleMention(emp)}
                            >
                              <Avatar className="h-5 w-5 mr-2">
                                <AvatarImage
                                  src={emp.photoURL || '/placeholder.svg'}
                                  alt={emp.name}
                                />
                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{emp.name}</span>
                            </div>
                          ))}
                        {employees.filter((emp) =>
                          emp.name.toLowerCase().includes(mentionSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2 text-gray-500">No users found</div>
                        )}
                      </div>
                    )}
                    <Button
                      onClick={handleAddComment}
                      className="mt-2"
                      disabled={newComment.trim() === '' || isAddingComment}
                      aria-label="Add Comment"
                    >
                      {isAddingComment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileTextIcon className="mr-2 h-4 w-4" />
                      )}
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-1/3 border border-gray-200 rounded-md">
            <Card className="border-none">
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !task.dueDate && 'text-muted-foreground'
                          )}
                          aria-label="Select Due Date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {task.dueDate
                            ? format(new Date(task.dueDate), 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={task.dueDate ? new Date(task.dueDate) : undefined}
                          onSelect={(date) => handleChange('dueDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleChange('status', value)}
                      aria-label="Select Status"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee */}
                  <div className="space-y-2">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select
                      value={task.assignee?.id || ''}
                      onValueChange={(value) => {
                        const selectedEmployee = employees.find((emp) => emp.id === value)
                        if (selectedEmployee) {
                          handleChange('assignee', {
                            id: selectedEmployee.id,
                            name: selectedEmployee.name,
                            email: selectedEmployee.email,
                            role: selectedEmployee.role,
                          })
                        }
                      }}
                      aria-label="Select Assignee"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center">
                              <Avatar className="h-5 w-5 mr-2">
                                <AvatarImage
                                  src={emp.photoURL || '/placeholder.svg'}
                                  alt={emp.name}
                                />
                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {emp.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handleChange('priority', value)}
                      aria-label="Select Priority"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskPriorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            <div className="flex items-center">
                              {React.createElement(priorityIcons[priority].icon, {
                                className: `h-4 w-4 mr-2 ${priorityIcons[priority].color}`,
                                'aria-hidden': true,
                              })}
                              <span className="capitalize">{priority}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={task.type}
                      onValueChange={(value) => handleChange('type', value)}
                      aria-label="Select Type"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center">
                              {React.createElement(taskTypeIcons[type].icon, {
                                className: `h-4 w-4 mr-2 ${taskTypeIcons[type].color}`,
                                'aria-hidden': true,
                              })}
                              <span className="capitalize">{type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Complexity */}
                  <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select
                      value={task.complexity}
                      onValueChange={(value) => handleChange('complexity', value)}
                      aria-label="Select Complexity"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskComplexities.map((complexity) => (
                          <SelectItem key={complexity} value={complexity}>
                            <span className="capitalize">{complexity}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Efforts */}
                  <div className="space-y-2">
                    <Label htmlFor="efforts">Efforts</Label>
                    <Select
                      value={task.efforts}
                      onValueChange={(value) => handleChange('efforts', value)}
                      aria-label="Select Efforts"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select efforts" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskEfforts.map((effort) => (
                          <SelectItem key={effort} value={effort}>
                            <span className="capitalize">{effort}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Estimate */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Time Estimate (hours)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="time"
                        type="number"
                        value={editingField === 'time' ? tempEditValues.time : task.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        onBlur={() => handleSaveField('time')}
                        onFocus={() => setEditingField('time')}
                        aria-label="Edit Time Estimate"
                      />
                      {editingField !== 'time' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleEditField('time')}
                              size="sm"
                              variant="ghost"
                              aria-label="Edit Time Estimate"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Edit Time Estimate
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
