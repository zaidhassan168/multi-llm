import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/types/tasks'

type SortableItemProps = {
  id: string
  task: Task
  onClick: () => void
}

export function SortableItem({ id, task, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-lg shadow-sm mb-4 cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-sm font-semibold mb-1">{task.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
      <div className="mt-2 text-xs text-gray-500">
        <p>Time: {task.time}h</p>
        <p>Efforts: {task.efforts}</p>
        <p>Assignee: {task.assignee}</p>
      </div>
    </div>
  )
}