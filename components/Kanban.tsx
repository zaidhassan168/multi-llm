'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
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
    UploadIcon
} from 'lucide-react'
import { Task } from '@/types/tasks'
import { TaskModal } from './TaskModal'
import { FileUploadModal } from '@/components/FileUploadModal'

const columns = [
    { id: 'backlog', title: 'Backlog', icon: BackpackIcon, color: 'bg-gray-100' },
    { id: 'todo', title: 'To Do', icon: ListTodoIcon, color: 'bg-blue-100' },
    { id: 'inProgress', title: 'In Progress', icon: ActivityIcon, color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', icon: CheckIcon, color: 'bg-green-100' },
]

const TaskItem = ({ task, index, onClick }: { task: Task; index: number; onClick: () => void }) => {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-white rounded-lg p-3 shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={onClick}
                >
                    <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">{task.description}</p>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{task.time}h</span>
                        <span>{task.efforts}</span>
                        <span>{task.assignee}</span>
                    </div>
                </div>
            )}
        </Draggable>
    )
}

const Column = ({ id, title, icon: Icon, color, tasks, onTaskClick }: {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}) => {
    return (
        <div className={`w-80 ${color} rounded-lg p-4 shadow-md`}>
            <h2 className="mb-4 text-sm font-semibold text-gray-700 flex items-center">
                <Icon className="mr-2 h-4 w-4" />
                {title}
                <span className="ml-auto bg-white text-gray-600 rounded-full px-2 py-1 text-xs">
                    {tasks.length}
                </span>
            </h2>
            <Droppable droppableId={id}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto"
                    >
                        {tasks.map((task, index) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={() => onTaskClick(task)}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    )
}

export default function Kanban() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const { user } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
        if (user?.email) {
            fetchTasks()
        }
    }, [user])

    useEffect(() => {
        if (selectedTask) {
            setIsModalOpen(true)
        }
    }, [selectedTask])

    const fetchTasks = async () => {
        try {
            const response = await fetch(`/api/tasks?email=${user?.email}`)
            const data = await response.json()
            setTasks(data)
        } catch (error) {
            console.error('Error fetching tasks:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch tasks',
                variant: 'destructive'
            })
        }
    }

    const addTask = async (task: Omit<Task, 'id'>) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, email: user?.email }),
            })
            console.log(response)
            const data = await response.json()
            console.log(data)
            setTasks(prevTasks => [...prevTasks, { ...task, id: data.id }])
            toast({
                title: 'Success',
                description: 'Task added successfully'
            })
        } catch (error) {
            console.error('Error adding task:', error)
            toast({
                title: 'Error',
                description: 'Failed to add task',
                variant: 'destructive'
            })
        }
    }

    const updateTask = async (task: Task) => {
        try {
            await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, email: user?.email }),
            })
            setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? task : t))
            toast({
                title: 'Success',
                description: 'Task updated successfully'
            })
        } catch (error) {
            console.error('Error updating task:', error)
            toast({
                title: 'Error',
                description: 'Failed to update task',
                variant: 'destructive'
            })
        }
    }

    const deleteTask = async (id: string) => {
        try {
            await fetch('/api/tasks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, email: user?.email }),
            })
            setTasks(prevTasks => prevTasks.filter(t => t.id !== id))
            toast({
                title: 'Success',
                description: 'Task deleted successfully'
            })
        } catch (error) {
            console.error('Error deleting task:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete task',
                variant: 'destructive'
            })
        }
    }


    const onDragEnd = useCallback(
        (result: DropResult) => {
          const { destination, source, draggableId } = result
      
          if (!destination) {
            return
          }
      
          // Avoid unnecessary updates if the item is dropped in the same place
          if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
          ) {
            return
          }
      
          setTasks((prevTasks) => {
            // Find the task that is being dragged
            const taskIndex = prevTasks.findIndex(task => task.id === draggableId)
            if (taskIndex === -1) return prevTasks // Task not found, no state update
      
            // Get the task that is being moved
            const movedTask = { ...prevTasks[taskIndex] } // Clone the task to avoid direct state mutation
      
            // Remove the task from its original position
            const updatedTasks = Array.from(prevTasks)
            updatedTasks.splice(taskIndex, 1)
      
            // Update the task status if it is moved to a different column
            if (source.droppableId !== destination.droppableId) {
              movedTask.status = destination.droppableId as Task['status']
            }
      
            // Insert the task into its new position
            updatedTasks.splice(destination.index, 0, movedTask)
      
            // Save updated task status to the backend only if the status has changed
            if (source.droppableId !== destination.droppableId) {
              updateTask(movedTask)
            }
      
            return updatedTasks
          })
        },
        [updateTask]
      )
      
      
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="h-16 flex items-center justify-between px-6 bg-white shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800 flex items-center">
                    <KanbanIcon className="mr-2 h-6 w-6 text-blue-500" />
                    Kanban Board
                </h1>
                <div className="flex space-x-4">
                    <Button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Upload Tasks
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedTask(null)
                            setIsModalOpen(true)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex space-x-6">
                        {columns.map(({ id, title, icon, color }) => (
                            <Column
                                key={id}
                                id={id}
                                title={title}
                                icon={icon}
                                color={color}
                                tasks={tasks.filter(task => task.status === id)}
                                onTaskClick={(task) => {
                                    setSelectedTask(task)
                                    setIsModalOpen(true)
                                }}
                            />
                        ))}
                    </div>
                </DragDropContext>
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
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div>
    )
}