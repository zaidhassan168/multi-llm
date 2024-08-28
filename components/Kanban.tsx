// /app/(your-component).tsx
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
  } from 'react-beautiful-dnd';
  import { useState, useEffect, AwaitedReactNode, ClassAttributes, HTMLAttributes, JSX, JSXElementConstructor, LegacyRef, ReactElement, ReactNode, ReactPortal, ClassAttributes, HTMLAttributes, JSX, LegacyRef } from 'react';
  import { Task } from '@/types/tasks';
  import TaskCard from '@/components/TaskCard';
  
  export default function KanbanBoard() {
    const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({
      backlog: [],
      todo: [],
      'in progress': [],
      done: [],
    });
    useEffect(() => {
        const fetchTasks = async () => {
          const response = await fetch('/api/tasks');
          const data = await response.json();
          // Group tasks by status
          const groupedTasks = data.reduce((acc: any, task: Task) => {
            acc[task.status].push(task);
            return acc;
          }, { backlog: [], todo: [], 'in progress': [], done: [] });
      
          setTasks(groupedTasks);
        };
      
        fetchTasks();
      }, []);
    const onDragEnd = async (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;
  
      const sourceTasks = [...tasks[source.droppableId]];
      const [removed] = sourceTasks.splice(source.index, 1);
      const destTasks = [...tasks[destination.droppableId]];
  
      removed.status = destination.droppableId as Task['status'];
      destTasks.splice(destination.index, 0, removed);
  
      setTasks({
        ...tasks,
        [source.droppableId]: sourceTasks,
        [destination.droppableId]: destTasks,
      });
  
      await fetch(`/api/tasks/${removed.id}`, {
        method: 'PATCH',
        body: JSON.stringify(removed),
      });
    };
  
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4">
          {['backlog', 'todo', 'in progress', 'done'].map((column) => (
            <Droppable droppableId={column} key={column}>
              {(provided: { droppableProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; innerRef: LegacyRef<HTMLDivElement> | undefined; placeholder: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="w-72"
                >
                  <h2 className="mb-4 text-sm font-medium text-gray-400 dark:text-gray-300 flex items-center">
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </h2>
                  {tasks[column].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided: { innerRef: LegacyRef<HTMLDivElement> | undefined; draggableProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; dragHandleProps: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>; }) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskCard task={task} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    );
  }
  