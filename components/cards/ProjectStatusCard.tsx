import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Clock, CheckSquare, XSquare, AlertTriangle, TrendingUp } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
interface ProjectStatusProps {
  project: {
    onTrack: boolean
    totalTasks: number
    totalTasksCompleted: number
    totalTasksIncomplete: number
    totalTasksOverdue: number
    totalTasksOnTrack: number
    totalTasksHours: number
    tasksHoursCompleted: number
  }
}

export default function ProjectStatusCard({ project }: ProjectStatusProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-800 h-[300px]">
      <CardHeader className="pb-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Project Status</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[200px]">
      <CardContent className="pt-4 px-4">
        <div className={`flex items-center text-xl font-bold mb-4 ${project.onTrack ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {project.onTrack ? (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6" />
              On Track
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-6 w-6" />
              Off Track
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <StatusItem
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="Total Tasks"
            value={project.totalTasks}
          />
          <StatusItem
            icon={<CheckSquare className="h-4 w-4 text-green-500" />}
            label="Completed Tasks"
            value={project.totalTasksCompleted}
          />
          <StatusItem
            icon={<XSquare className="h-4 w-4 text-red-500" />}
            label="Incomplete Tasks"
            value={project.totalTasksIncomplete}
          />
          <StatusItem
            icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
            label="Overdue Tasks"
            value={project.totalTasksOverdue}
          />
          <StatusItem
            icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
            label="On Track Tasks"
            value={project.totalTasksOnTrack}
          />
          <StatusItem
            icon={<Clock className="h-4 w-4 text-indigo-500" />}
            label="Total Task Hours"
            value={`${project.totalTasksHours} hrs`}
          />
          <StatusItem
            icon={<CheckSquare className="h-4 w-4 text-teal-500" />}
            label="Task Hours Completed"
            value={`${project.tasksHoursCompleted} hrs`}
            colSpan={2}
          />
        </div>
      </CardContent>
      </ScrollArea>
    </Card>
  )
}

interface StatusItemProps {
  icon: React.ReactNode
  label: string
  value: number | string
  colSpan?: number
}

function StatusItem({ icon, label, value, colSpan = 1 }: StatusItemProps) {
  return (
    <div className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <div className="flex items-center">
        {icon}
        <span className="ml-2 text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  )
}