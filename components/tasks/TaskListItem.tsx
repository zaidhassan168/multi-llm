'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Timestamp } from 'firebase/firestore';
import { convertToDate, convertToDateTime } from '@/utils/convertTimeStamp'
import {
  ClockIcon,
  CalendarIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  CheckCircleIcon,
  RefreshCwIcon
} from 'lucide-react'
import { getPriorityColor, getStatusColor } from '@/lib/colors/colors'
import { Task } from '@/models/task'

const TaskListItem = React.memo(({ task, isSelected, onClick }: { task: Task; isSelected: boolean; onClick: () => void }) => {
  const completedAtDate = task.completedAt ? convertToDate(task.completedAt) : null;
  const lastUpdatedAtDate = task.lastUpdated ? convertToDateTime(task.lastUpdated) : null;
  const isCompleted = task.status === 'done'
      
  console.log('task.completedAt:', task.completedAt, 'Type:', typeof task.completedAt);
  console.log('task.lastUpdatedAt:', task.lastUpdated, 'Type:', typeof task.lastUpdated);

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
          {lastUpdatedAtDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <RefreshCwIcon className="mr-1 h-3 w-3" />
                    <span>{lastUpdatedAtDate}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last updated</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
        <div className="flex items-center space-x-2">
          {isCompleted && completedAtDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CheckCircleIcon className="mr-1 h-3 w-3" />
                    <span>{completedAtDate.toLocaleDateString()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Completed on</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
        </div>
      </CardFooter>
    </Card>
  )
})

TaskListItem.displayName = "TaskItem"

export default TaskListItem