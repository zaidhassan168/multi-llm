import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ClockIcon, UserIcon, TagIcon } from 'lucide-react'
import { Task } from '@/models/task'

interface TaskItemProps {
  task: Task
  onClick: () => void
  index?: number
  isDraggable?: boolean
  isSelected?: boolean
}

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

const TaskItem = React.memo(({ task, onClick, index = 0, isDraggable = false, isSelected = false }: TaskItemProps) => {
  const taskContent = (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 ${getPriorityColor(task.priority || 'null')} ${isSelected ? 'ring-2 ring-blue-500' : ''} ${(task.priority === 'urgent' || task.priority === 'critical') ? 'border-r-4 border-r-red-500' : ''}`}
      onClick={onClick}
    >
      <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {task.time}h
        </Badge>
        <Badge variant="secondary" className={`flex items-center gap-1 ${getEffortColor(task.efforts)}`}>
          <TagIcon className="w-3 h-3" />
          {task.efforts}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <UserIcon className="w-3 h-3" />
          {task.assignee?.name}
        </Badge>
      </div>
      <Progress value={task.status === 'done' ? 100 : task.status === 'inProgress' ? 50 : task.status === 'todo' ? 25 : 0} className="h-1" />
    </div>
  )

  if (isDraggable) {
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {taskContent}
          </div>
        )}
      </Draggable>
    )
  }

  return taskContent
})

TaskItem.displayName = "TaskItem"

export default TaskItem