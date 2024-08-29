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
  useDroppable
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
  { id: 'backlog', title: 'Backlog', icon: BackpackIcon },
  { id: 'todo', title: 'To Do', icon: ListTodoIcon },
  { id: 'inProgress', title: 'In Progress', icon: ActivityIcon },
  { id: 'done', title: 'Done', icon: CheckIcon },
]
function Column({ id, title, icon: Icon, tasks, onTaskClick }: { id: string; title: string; icon: React.ElementType; tasks: Task[]; onTaskClick: (task: Task) => void }) {
    const { setNodeRef } = useDroppable({ id });
  
    return (
      <div ref={setNodeRef} className="w-72">
        <h2 className="mb-4 text-sm font-medium text-gray-400 dark:text-gray-300 flex items-center">
          <Icon className="mr-2 h-4 w-4" />
          {title}
        </h2>
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[200px]">
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
      useSensor(KeyboardSensor)
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

//   const updateTask = async (task: Task) => {
//     try {
//       await fetch('/api/tasks', {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ...task, email: user?.email }),
//       })
//       setTasks(tasks.map(t => t.id === task.id ? task : t))
//       toast({ title: 'Success', description: 'Task updated successfully' })
//     } catch (error) {
//       console.error('Error updating task:', error)
//       toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' })
//     }
//   }

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overTaskId = over.id as string;
    console.log('over', overTaskId);
    const activeTask = tasks.find((task) => task.id === activeTaskId);
    if (!activeTask) return;

    let newStatus: "backlog" | "todo" | "done" | "in progress";

    // Check if we're dropping onto a column or a task
    if (columns.some(column => column.id === overTaskId)) {
      newStatus = overTaskId as "backlog" | "todo" | "done" | "in progress";
    } else {
      // If dropping onto a task, find the column of that task
      const overTask = tasks.find((task) => task.id === overTaskId);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    // Only update if the status has changed
    if (activeTask.status !== newStatus) {
      const updatedTask = { ...activeTask, status: newStatus };
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === activeTaskId ? updatedTask : task
        )
      );

      // Update the task in your backend
      updateTask(updatedTask);
    }
  }


  const handleDragOver = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find(task => task.id === active.id)
    const overTask = tasks.find(task => task.id === over.id)

    if (!activeTask || !overTask || activeTask.status !== overTask.status) return

    setTasks(tasks => {
      const oldIndex = tasks.findIndex(t => t.id === activeTask.id)
      const newIndex = tasks.findIndex(t => t.id === overTask.id)
      return arrayMove(tasks, oldIndex, newIndex)
    })
  }
  return (
    <div className="flex flex-col h-screen">
      <header className="h-[60px] flex items-center justify-between px-4 shadow-md">
        <h1 className="text-sm font-medium text-gray-900 dark:text-gray-50 flex items-center">
          <KanbanIcon className="mr-2 h-4 w-4" />
          Kanban Board
        </h1>
        <Button
          onClick={() => {
            setSelectedTask(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </header>
      <main className="flex-1 overflow-auto py-4 px-4 bg-gray-100">
        {isMounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4">
              {columns.map(column => (
                <Column
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  icon={column.icon}
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
          <div>Loading...</div>
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