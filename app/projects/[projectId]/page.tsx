"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TasksByStages from "@/components/tasks/TasksByStages";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertOctagon, AlertTriangle, ChevronRight, ChevronDown, PlusCircle, Edit, MoreVertical, CalendarIcon, ClockIcon, UserIcon, MessageSquareIcon, FlagIcon } from "lucide-react";
import { Task, fetchTasksByProject } from "@/models/task";
import { Project, getProjectById } from "@/models/project";
import { Employee, fetchEmployees } from "@/models/employee";
import { useToast } from "@/components/ui/use-toast";
import { Transition } from "@headlessui/react";
import ProjectDialog from "@/components/ProjectDialog";
import ProjectStatusCard from "@/components/cards/ProjectStatusCard";
import { EmployeeSummary } from "@/models/summaries";
import { TaskModal } from "@/components/TaskModal";
import TaskRow from "@/components/tasks/TaskRow";
import {getStatusColorMuted } from "@/lib/colors/colors";
import LottieLoading from "@/components/LottieLoading";
export default function ProjectDetails() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [expandedStatuses, setExpandedStatuses] = useState<string[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [project, tasksData] = await Promise.all([getProjectById(projectId), fetchTasksByProject(projectId)]);
      
      if (project) {
        setProject(project);
        setTasks(tasksData);
        setEmployees(project.resources || []);
      } else {
        setError("Project not found");
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setError("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  };

  const statusGroups = useMemo(() => ({
    done: tasks.filter((task) => task.status === "done"),
    inProgress: tasks.filter((task) => task.status === "inProgress"),
    todo: tasks.filter((task) => task.status === "todo"),
    backlog: tasks.filter((task) => task.status === "backlog"),
  }), [tasks]);

  const toggleCollapse = useCallback((status: string) => {
    setExpandedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const calculateProjectProgress = useCallback((): number => {
    return (project?.progress as number) || 0;
  }, [project]);


  const projectData = useMemo(() => ({
    onTrack: project?.onTrack || false,
    totalTasks: project?.totalTasks as number,
    totalTasksCompleted: project?.totalTasksCompleted as number,
    totalTasksIncomplete: project?.totalTasksIncomplete as number,
    totalTasksOverdue: project?.totalTasksOverdue as number,
    totalTasksOnTrack: project?.totalTasksOnTrack as number,
    totalTasksHours: project?.totalTasksHours as number,
    tasksHoursCompleted: project?.tasksHoursCompleted as number,
  }), [project]);

  const getTaskStats = useCallback(() => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const criticalInProgress = tasks.filter((t) => t.status === "inProgress" && t.priority === "critical").length;
    const highDone = tasks.filter((t) => t.status === "done" && t.priority === "high").length;

    return { totalTasks, doneTasks, criticalInProgress, highDone };
  }, [tasks]);

  const handleTaskAdded = useCallback(() => {
    fetchProjectData();
    toast({
      title: "Success",
      description: "Task added successfully",
    });
  }, [toast]);

  const handleTaskUpdated = useCallback(() => {
    fetchProjectData();
    toast({
      title: "Success",
      description: "Task updated successfully",
    });
  }, [toast]);

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    try {
      setProject(updatedProject);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  }, [toast]);



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
       <LottieLoading size="large"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold mr-2">
          {project.name} - Project Details
        </h1>
        <ProjectDialog project={project} onProjectUpdated={() => handleProjectUpdated(project)} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedTask(null);
            setIsTaskModalOpen(true);
          }}
          className="flex items-center space-x-2 ml-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Task</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-[300px]">
          <CardHeader className="pb-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <CardTitle className="text-lg">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <Progress value={calculateProjectProgress()} className="w-[80%]" />
              <span className="ml-2 font-bold">{calculateProjectProgress()}%</span>
            </div>
            <ScrollArea className="h-[180px]">
              <p className="text-sm text-muted-foreground">
                Additional project progress details can be added here. This area is scrollable if the content exceeds the available space.
              </p>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-[300px]">
          <CardHeader className="pb-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <CardTitle className="text-lg">Stages Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {project.stages && project.stages.length > 0 ? (
                  project.stages.map((stage: any) => (
                    <div key={stage.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{stage.name}</span>
                        <span className="text-sm font-sans">
                          {typeof stage.progress === 'number' ? stage.progress : 0}%
                        </span>
                      </div>
                      <Progress value={typeof stage.progress === 'number' ? stage.progress : 0} className="h-1" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No stages available for this project.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <ProjectStatusCard project={projectData} />

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-[300px]">
          <CardHeader className="pb-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <CardTitle className="text-lg">Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              {project && tasks.length > 0 ? (
                <>
                  <div className="text-2xl font-bold mb-4">
                    {getTaskStats().totalTasks} Tasks
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Completed:
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {getTaskStats().doneTasks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertOctagon className="mr-2 h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                          Critical (In Progress):
                        </span>
                      </div>
                      <Badge variant="destructive">
                        {getTaskStats().criticalInProgress}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">
                          High (Completed):
                        </span>
                      </div>
                      <Badge variant="default" className="bg-yellow-500">
                        {getTaskStats().highDone}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No tasks available
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(statusGroups).map((status) => (
            <div key={status} className="mb-4">
              <div
                className={`flex justify-between items-center cursor-pointer p-3 rounded-lg ${getStatusColorMuted(status)} transition-colors duration-200`}
                onClick={() => toggleCollapse(status)}
                role="button"
                aria-expanded={expandedStatuses.includes(status)}
                aria-controls={`${status}-content`}
              >
                <span className="font-semibold capitalize">
                  {status} (
                  {statusGroups[status as keyof typeof statusGroups].length}{" "}
                  tasks)
                </span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 ${expandedStatuses.includes(status)
                    ? "transform rotate-180"
                    : ""
                    }`}
                />
              </div>
              <Transition
                show={expandedStatuses.includes(status)}
                enter="transition-all duration-300 ease-out"
                enterFrom="transform scale-y-0 opacity-0"
                enterTo="transform scale-y-100 opacity-100"
                leave="transition-all duration-300 ease-in"
                leaveFrom="transform scale-y-100 opacity-100"
                leaveTo="transform scale-y-0 opacity-0"
              >
                <div id={`${status}-content`}>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusGroups[status as keyof typeof statusGroups].map(
                        (task) => (
                          <TaskRow key={task.id} task={task} handleEditTask={handleEditTask} />
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Transition>
            </div>
          ))}
        </CardContent>
      </Card>
      <TasksByStages project={project} tasks={tasks} />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Assigned Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    {employee.availability !== undefined ? (
                      <span
                        className={`font-bold ${employee.availability >= 75
                          ? "text-green-600"
                          : employee.availability >= 25
                            ? "text-yellow-600"
                            : "text-red-600"
                          }`}
                      >
                        {employee.availability}%
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        projectId={projectId}
        task={selectedTask}
        onTaskAdded={handleTaskAdded}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
