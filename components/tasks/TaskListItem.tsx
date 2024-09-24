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

const TaskListItem = React.memo(({ task, isSelected, onClick }: { task: Task; isSelected: boolean; onClick: () => void }) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'inProgress': return 'bg-blue-100 text-blue-800'
      case 'done': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card 
      className={`mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <span className="sr-only">Task options</span>
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Task options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  <span>{new Date(task.dueDate || '').toLocaleDateString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Due date</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <ClockIcon className="mr-1 h-3 w-3" />
                  <span>{task.time}h</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <MessageSquareIcon className="mr-1 h-3 w-3" />
                  <span>{task.comments?.length || 0}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comments</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Badge className={getPriorityColor(task.priority || 'null')}>
            {task.priority}
          </Badge>
          <Badge className={getStatusColor(task.status)}>
            {task.status.replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee?.phtoURL} alt={task.assignee?.name} />
                <AvatarFallback>{task.assignee?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>Assigned to {task.assignee?.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
})

TaskListItem.displayName = "TaskItem"

export default TaskListItem