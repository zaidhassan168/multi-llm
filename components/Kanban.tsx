'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  DragOverEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  ActivityIcon,
  BackpackIcon,
  CheckIcon,
  KanbanIcon,
  ListTodoIcon,
  PlusIcon,
} from 'lucide-react'
import { SortableItem } from '@/components/SortableItem'
import { Task } from '@/types/tasks'
import { TaskModal } from './TaskModal'

const columns = [
  { id: 'backlog', title: 'Backlog', icon: BackpackIcon, color: 'bg-gray-200' },
  { id: 'todo', title: 'To Do', icon: ListTodoIcon, color: 'bg-blue-200' },
  { id: 'inProgress', title: 'In Progress', icon: ActivityIcon, color: 'bg-yellow-200' },
  { id: 'done', title: 'Done', icon: CheckIcon, color: 'bg-green-200' },
]

function Column({ id, title, icon: Icon, color, tasks, onTaskClick }: { id: string; title: string; icon: React.ElementType; color: string; tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`w-72 ${color} rounded-lg p-4`}>
      <h2 className="mb-4 text-sm font-medium text-gray-700 flex items-center">
        <Icon className="mr-2 h-4 w-4" />
        {title}
      </h2>
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[200px] space-y-2">
          {tasks.map((task) => (
            <SortableItem
              key={task.id}
              id={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setIsMounted(true)
    if (user?.email) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?email=${user?.email}`)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({ title: 'Error', description: 'Failed to fetch tasks', variant: 'destructive' })
    }
  }

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, email: user?.email }),
      })
      const data = await response.json()
      setTasks([...tasks, { ...task, id: data.id }])
      toast({ title: 'Success', description: 'Task added successfully' })
    } catch (error) {
      console.error('Error adding task:', error)
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' })
    }
  }

  const updateTask = async (task: Task) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, email: user?.email }),
      })
      setTasks(tasks.map(t => t.id === task.id ? task : t))
      toast({ title: 'Success', description: 'Task updated successfully' })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' })
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email: user?.email }),
      })
      setTasks(tasks.filter(t => t.id !== id))
      toast({ title: 'Success', description: 'Task deleted successfully' })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveATask = tasks.find(task => task.id === activeId);
    const isOverATask = tasks.find(task => task.id === overId);

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isOverATask) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          // Switching columns
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        // Same column
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over a column
    const overColumn = columns.find(col => col.id === overId);
    if (overColumn) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        
        tasks[activeIndex].status = overColumn.id as "backlog" | "todo" | "inProgress" | "done";
        
        // Move the task to the end of the new column
        return arrayMove(tasks, activeIndex, tasks.length - 1);
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const activeTask = tasks.find((task) => task.id === activeTaskId);
    if (!activeTask) return;

    // Update the task in the backend
    updateTask(activeTask);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="h-[60px] flex items-center justify-between px-4 bg-white shadow-md">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center">
          <KanbanIcon className="mr-2 h-5 w-5 text-blue-500" />
          Kanban Board
        </h1>
        <Button
          onClick={() => {
            setSelectedTask(null)
            setIsModalOpen(true)
          }}
          className="flex items-center bg-blue-500 hover:bg-blue-600"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </header>
      <main className="flex-1 overflow-auto py-6 px-4">
        {isMounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-6">
              {columns.map(column => (
                <Column
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  icon={column.icon}
                  color={column.color}
                  tasks={tasks.filter(task => task.status === column.id)}
                  onTaskClick={(task) => {
                    setSelectedTask(task)
                    setIsModalOpen(true)
                  }}
                />
              ))}
            </div>
            <DragOverlay>
              {activeId ? (
                <SortableItem
                  id={activeId}
                  task={tasks.find(task => task.id === activeId)!}
                  onClick={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </main>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        onSave={(task) => {
          if (task.id) {
            updateTask(task)
          } else {
            addTask(task)
          }
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        onDelete={deleteTask}
      />
    </div>
  )
}