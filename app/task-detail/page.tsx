'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchTasksEmail, updateTask, Task, Comment, updateTaskComments, fetchTasksAll } from '@/models/task'
import { fetchEmployees, Employee } from '@/models/employee'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import LottieLoading from '@/components/LottieLoading'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import TaskListItem from '@/components/tasks/TaskListItem'
import {
  SearchIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  SendIcon,
  SmileIcon,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { priorityIcons, taskTypeIcons } from '@/lib/icons/icons'
import TaskFilterSidebar from '@/components/tasks/TaskFilterSidebar'
import { fetchProjects, Project } from '@/models/project'
import { storeCommentNotification } from '@/utils/storeNotifications'
type FilterState = {
  assignee: string | null
  project: string | null
  priority: string | 'all' | null
  type: string | 'all' | null
}

const emojis = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀']

export default function TaskListView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesMap, setEmployeesMap] = useState<{ [name: string]: Employee }>({})
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [projects, setProjects] = useState<Project[]>([])
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    project: null,
    priority: null,
    type: null,
  })
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const fetchTasksData = useCallback(async () => {
    if (user?.email) {
      try {
        setIsLoading(true)
        const [tasksData, employeesData] = await Promise.all([
          fetchTasksAll(),
          fetchEmployees(),
        ])

        const employeesMapData = employeesData.reduce((map, employee) => {
          map[employee.name] = employee
          return map
        }, {} as { [name: string]: Employee })

        setTasks(tasksData)
        setFilteredTasks(tasksData)
        setEmployees(employeesData)
        setEmployeesMap(employeesMapData)
        setError(null)
      } catch (error) {
        console.error('Failed to load data', error)
        setError('Failed to load data. Please try again.')
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
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

  useEffect(() => {
    console.log('filters', filters)
    let filtered = tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (filters.assignee && filters.assignee !== 'all') {
      filtered = filtered.filter((task) => task.assignee?.name === filters.assignee)
    }
    if (filters.project && filters.project !== 'all') {
      filtered = filtered.filter((task) => task.projectId === filters.project)
    }
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filters.priority)
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((task) => task.type === filters.type)
    }
  
    setFilteredTasks(filtered)
  }, [tasks, searchTerm, filters])
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }))
  }
  const handleAddComment = async () => {
    if (selectedTask && newComment.trim() !== '') {
      const mentionedUsers = newComment.match(/@(\w+)/g)?.map((mention) => mention.slice(1)) || []

      const authorName = user?.displayName || user?.email || 'Anonymous'

      const newCommentData: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: authorName,
        createdAt: new Date(),
        taskId: selectedTask.id,
        reactions: {},
        mentions: mentionedUsers,
      }

      const updatedTask = {
        ...selectedTask,
        comments: [...(selectedTask.comments || []), newCommentData],
      }
      try {
        await updateTaskComments(selectedTask.id, updatedTask.comments, user?.email || '')
        setSelectedTask(updatedTask)
        setNewComment('')
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        )
        toast({
          title: 'Success',
          description: 'Comment added successfully.',
        })
        mentionedUsers.forEach((mentionedUser) => {
          console.log(
            `Notifying ${mentionedUser} about mention in task ${selectedTask.id}`
          )
        })
        await storeCommentNotification(
          selectedTask.id,
          selectedTask.title,
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
      }
    }
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewComment(value)

    const mentionMatch = value.match(/@(\w*)$/)
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1])
      setMentionIndex(value.lastIndexOf(`@${mentionMatch[1]}`))
      setIsMentionPopoverOpen(true)
    } else {
      setMentionSearch('')
      setMentionIndex(-1)
      setIsMentionPopoverOpen(false)
    }
  }

  const handleMentionSelect = (employeeName: string) => {
    if (mentionIndex !== -1) {
      const beforeMention = newComment.slice(0, mentionIndex)
      const afterMention = newComment
        .slice(mentionIndex)
        .replace(/@\w*$/, `@${employeeName} `)
      setNewComment(beforeMention + afterMention)
      setIsMentionPopoverOpen(false)
      textareaRef.current?.focus()
    }
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    if (selectedTask && user) {
      const userName = user.displayName || user.email || 'Anonymous';
      const updatedComments = selectedTask.comments?.map((comment) => {
        if (comment.id === commentId) {
          const reactions = { ...comment.reactions };
          if (reactions[emoji]?.includes(userName)) {
            reactions[emoji] = reactions[emoji].filter((name) => name !== userName);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji] = [...(reactions[emoji] || []), userName];
          }
          return { ...comment, reactions };
        }
        return comment;
      }) || [];

      try {
        await updateTaskComments(selectedTask.id, updatedComments, user.email || '');
        setSelectedTask({ ...selectedTask, comments: updatedComments });
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === selectedTask.id ? { ...task, comments: updatedComments } : task
          )
        );
      } catch (error) {
        console.error('Failed to update reaction', error);
        toast({
          title: 'Error',
          description: 'Failed to update reaction. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePriorityChange = async (priority: Task['priority']) => {
    if (selectedTask && user) {
      try {
        const updatedTask = { ...selectedTask, priority };
        await updateTask(updatedTask, user.email || '');
        setSelectedTask(updatedTask);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        toast({
          title: 'Success',
          description: 'Task priority updated successfully.',
        });
      } catch (error) {
        console.error('Failed to update task priority', error);
        toast({
          title: 'Error',
          description: 'Failed to update task priority. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTypeChange = async (type: Task['type']) => {
    if (selectedTask && user) {
      try {
        const updatedTask = { ...selectedTask, type };
        await updateTask(updatedTask, user.email || '');
        setSelectedTask(updatedTask);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        toast({
          title: 'Success',
          description: 'Task type updated successfully.',
        });
      } catch (error) {
        console.error('Failed to update task type', error);
        toast({
          title: 'Error',
          description: 'Failed to update task type. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // const handleFilterChange = (newFilters: Partial<FilterState>) => {
  //   setFilters(prevFilters => ({
  //     ...prevFilters,
  //     ...newFilters,
  //   }))
  // }

  const handleSort = (key: 'priority' | 'dueDate' | 'createdAt') => {
    setSortBy(key)
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
  }

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = ['critical', 'urgent', 'high', 'medium', 'low', 'null']
      return sortOrder === 'asc'
        ? priorityOrder.indexOf(a.priority || 'null') - priorityOrder.indexOf(b.priority || 'null')
        : priorityOrder.indexOf(b.priority || 'null') - priorityOrder.indexOf(a.priority || 'null')
    } else if (sortBy === 'dueDate') {
      const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0)
      const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0)
      return sortOrder === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
    } else {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0)
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0)
      return sortOrder === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center">
          <LottieLoading size='small' />
          <span className="text-xl font-semibold text-primary">
            Loading tasks...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-xl font-semibold text-red-500 bg-red-100 p-4 rounded-lg">
          Error loading tasks: {error}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container flex h-screen bg-background">
        <div className="w-1/3 p-4 overflow-auto border-r">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative flex-grow mr-2">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-8 pr-2 py-1 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'priority' | 'dueDate' | 'createdAt') => handleSort(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="createdAt">Created At</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="space-y-4 pr-4">
              {sortedTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="w-2/3 p-4 bg-background flex flex-col">
          {selectedTask ? (
            <Card className="flex-grow overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle>{selectedTask.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden flex flex-col">
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedTask.description}
                </p>
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
                  <Select
                    value={selectedTask.priority || undefined}
                    onValueChange={(value) => handlePriorityChange(value as Task['priority'])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityIcons).map(([priority, { icon: Icon, color }]) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center">
                            <Icon className={`w-4 h-4 mr-2 ${color}`} />
                            <span className="capitalize">{priority}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedTask.type || undefined}
                    onValueChange={(value) => handleTypeChange(value as Task['type'])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(taskTypeIcons).map(([type, { icon: Icon, color }]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center">
                            <Icon className={`w-4 h-4 mr-2 ${color}`} />
                            <span className="capitalize">{type}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <h3 className="font-semibold mb-2">Comments</h3>
                <ScrollArea className="flex-grow pr-4">
                  <div className="space-y-4">
                    {selectedTask.comments?.map((comment) => (
                      <div key={comment.id} className="flex space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={employeesMap[comment.author]?.photoURL}
                            alt={comment.author}
                          />
                          <AvatarFallback>{comment.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {comment.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center mt-1 space-x-2">
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
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-secondary transition-colors"
                                >
                                  <SmileIcon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1">
                                <div className="flex space-x-1">
                                  {emojis.map((emoji) => (
                                    <Button
                                      key={emoji}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-secondary transition-colors"
                                      onClick={() =>
                                        handleReaction(comment.id, emoji)
                                      }
                                    >
                                      {emoji}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="mt-4 relative">
                <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="w-full">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Add a comment... Use @ to mention"
                        value={newComment}
                        onChange={handleCommentChange}
                        className="w-full"
                        rows={2}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-0"
                    align="start"
                    side="top"
                    sideOffset={5}
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search employees..."
                        value={mentionSearch}
                        onValueChange={setMentionSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                          {employees
                            .filter((employee) =>
                              employee.name
                                .toLowerCase()
                                .includes(mentionSearch.toLowerCase())
                            )
                            .map((employee) => (
                              <CommandItem
                                key={employee.id}
                                onSelect={() => handleMentionSelect(employee.name)}
                              >
                                <Avatar className="w-6 h-6 mr-2">
                                  <AvatarImage
                                    src={employee.photoURL}
                                    alt={employee.name}
                                  />
                                  <AvatarFallback>
                                    {employee.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {employee.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button onClick={handleAddComment} size="icon" className="ml-2">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a task to view details
            </div>
          )}
        </div>
        <TaskFilterSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onFilterChange={handleFilterChange}
          projectIds={Array.from(new Set(tasks.map((task) => task.projectId || '')))}
          employees={Array.from(new Set(tasks.map((task) => task.assignee?.name || '')))}
        />
      </div>
    </TooltipProvider>
  )
}
