'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { Task, fetchTasksAll } from '@/models/task';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-200',
  medium: 'bg-yellow-200',
  high: 'bg-orange-200',
  urgent: 'bg-red-200',
  critical: 'bg-purple-200',
  null: 'bg-gray-200',
};

export default function TaskTimeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const fetchedTasks = await fetchTasksAll();
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prevDate) => {
      if (viewMode === 'day') {
        return direction === 'prev' ? subDays(prevDate, 1) : addDays(prevDate, 1);
      } else if (viewMode === 'week') {
        return direction === 'prev' ? subWeeks(prevDate, 1) : addWeeks(prevDate, 1);
      } else {
        return direction === 'prev' ? subMonths(prevDate, 1) : addMonths(prevDate, 1);
      }
    });
  };

  let dateRange: Date[] = [];

  if (viewMode === 'day') {
    dateRange = [currentDate];
  } else if (viewMode === 'week') {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    dateRange = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
  }

  const groupTasksByAssignee = (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      const assigneeName = task.assignee?.name || 'Unassigned';
      if (!acc[assigneeName]) {
        acc[assigneeName] = [];
      }
      acc[assigneeName].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading tasks...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  const groupedTasks = groupTasksByAssignee(tasks);

  return (
    <div className="w-full p-4">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Date Headers */}
      <div
        className="grid gap-2 pt-4 text-center text-muted-foreground"
        style={{
          gridTemplateColumns: `repeat(${dateRange.length}, minmax(0, 1fr))`,
        }}
      >
        {dateRange.map((day, index) => (
          <div
            key={index}
            className={isSameDay(day, currentDate) ? 'text-primary font-bold' : ''}
          >
            {format(day, viewMode === 'month' ? 'MMM d' : 'EEE d')}
          </div>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="overflow-x-auto">
        {Object.entries(groupedTasks).map(([assigneeName, assigneeTasks]) => (
          <div key={assigneeName} className="flex border-b py-2">
            {/* Assignee Name */}
            <div className="w-1/6 min-w-[150px] p-2 font-medium">
              {assigneeName}
            </div>

            {/* Tasks */}
            <div
              className="w-full grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${dateRange.length}, minmax(0, 1fr))`,
              }}
            >
              {dateRange.map((day, dayIndex) => {
                const tasksForDay = assigneeTasks.filter((task) => {
                  const startDate = task.startDate
                    ? new Date(task.startDate)
                    : new Date();
                  const endDate = task.dueDate
                    ? new Date(task.dueDate)
                    : startDate;
                  return (
                    startDate <= day &&
                    endDate >= day &&
                    (viewMode !== 'day' || isSameDay(startDate, day))
                  );
                });

                // Debugging: Log the number of tasks for each day
                console.log(
                  `Assignee: ${assigneeName}, Date: ${format(
                    day,
                    'MMM d, yyyy'
                  )}, Tasks: ${tasksForDay.length}`
                );

                return (
                  <div
                    key={dayIndex}
                    className="border-l pl-2 flex flex-col space-y-2"
                  >
                    {tasksForDay.map((task, taskIndex) => (
                      <TooltipProvider key={`${task.id}-${taskIndex}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`${
                                priorityColors[task.priority || 'null']
                              } p-2 rounded-md cursor-pointer`}
                            >
                              <p className="text-sm font-medium truncate">
                                {task.title}
                              </p>
                              <p className="text-xs truncate">
                                {task.description}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="p-2">
                              <h4 className="font-bold">{task.title}</h4>
                              <p className="text-sm">{task.description}</p>
                              <div className="mt-2 space-y-1 text-xs">
                                <div>
                                  Start:{' '}
                                  {format(
                                    new Date(task.startDate || Date.now()),
                                    'MMM d, yyyy'
                                  )}
                                </div>
                                <div>
                                  Due:{' '}
                                  {task.dueDate
                                    ? format(
                                        new Date(task.dueDate),
                                        'MMM d, yyyy'
                                      )
                                    : 'Not set'}
                                </div>
                                <div>Time: {task.time}h</div>
                                <div>Status: {task.status}</div>
                                <div>
                                  Priority: {task.priority || 'Not set'}
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
