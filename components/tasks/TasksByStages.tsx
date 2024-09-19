'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from "@/components/ui/badge"
import { ChevronDown, CalendarIcon, ClockIcon, UserIcon } from "lucide-react"
import { Task } from "@/models/task"
import { Project } from "@/models/project"
import { Transition } from "@headlessui/react"
import { getStatusColorMuted } from "@/lib/colors/colors"

interface TasksByStagesProps {
  project: Project
  tasks: Task[]
}

export default function TasksByStages({ project, tasks }: TasksByStagesProps) {
  const [expandedStages, setExpandedStages] = useState<string[]>([])

  const getTasksForStage = (stageId: string) => {
    return tasks.filter(task => task.stageId === stageId)
  }

  const toggleStageCollapse = (stageId: string) => {
    setExpandedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300   mb-6">
      <CardHeader className="pb-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <CardTitle className="text-lg">Tasks by Stages</CardTitle>
      </CardHeader>
      <CardContent className="bg-card-background dark:bg-gray-900">
        <ScrollArea >
          {project.stages && project.stages.length > 0 ? (
            project.stages.map((stage: any) => (
              <div key={stage.id} className="mb-4">
                <div
                  className={`flex justify-between items-center cursor-pointer p-2 rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors duration-200`}
                  onClick={() => toggleStageCollapse(stage.id)}
                  role="button"
                  aria-expanded={expandedStages.includes(stage.id)}
                >
                  <h3 className="text-sm font-medium">{stage.name}</h3>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      expandedStages.includes(stage.id) ? "transform rotate-180" : ""
                    }`}
                  />
                </div>
                <Transition
                  show={expandedStages.includes(stage.id)}
                  enter="transition-all duration-300 ease-out"
                  enterFrom="transform scale-y-0 opacity-0"
                  enterTo="transform scale-y-100 opacity-100"
                  leave="transition-all duration-300 ease-in"
                  leaveFrom="transform scale-y-100 opacity-100"
                  leaveTo="transform scale-y-0 opacity-0"
                >
                  <div className="space-y-2 mt-2 pl-2">
                    {getTasksForStage(stage.id).map((task: Task) => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium truncate">{task.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColorMuted(task.status)}`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          {/* <div className="flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            <span>{task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : task.dueDate}</span>
                          </div> */}
                          <div className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            <span>{task.time}h</span>
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="w-3 h-3 mr-1" />
                            <span>{task?.assignee?.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}                  </div>
                </Transition>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No stages available for this project.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}