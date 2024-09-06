"use client";

import React, { useState, useEffect } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Calendar,
  User,
  Flag,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Task, fetchTasksAll } from "@/models/task";
import { Project, fetchProjects } from "@/models/project";
import { Employee, fetchEmployees } from "@/models/employee";
import { useToast } from "@/components/ui/use-toast";
import { AlertOctagon, AlertTriangle } from "lucide-react";
import { Transition } from "@headlessui/react";

export default function ProjectDetails() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedStatuses, setExpandedStatuses] = useState<string[]>([]);
  const [currentStageProgress, setCurrentStageProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
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
    try {
      const [projectsData, tasksData, employeesData] = await Promise.all([
        fetchProjects(),
        fetchTasksAll(),
        fetchEmployees(),
      ]);

      const currentProject = projectsData.find((p) => p.id === projectId);
      if (currentProject) {
        setProject(currentProject);
        setTasks(tasksData.filter((t) => t.projectId === projectId));
        setEmployees(
          employeesData.filter(
            (e) => e.projectIds?.includes(projectId) ?? false,
          ),
        );
      } else {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusGroups = {
    done: tasks.filter((task) => task.status === "done"),
    inProgress: tasks.filter((task) => task.status === "inProgress"),
    todo: tasks.filter((task) => task.status === "todo"),
    backlog: tasks.filter((task) => task.status === "backlog"),
  };

  const toggleCollapse = (status: string) => {
    setExpandedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const calculateStageProgress = (): number => {
    if (!project?.currentStage?.tasks) return 0;

    const stageTasks = project.currentStage.tasks
      // .map((taskId) => tasks.find((t) => t.id === taskId))
      // .filter((task): task is Task => Boolean(task));

    if (stageTasks.length === 0) return 0;

    const completedTasks = stageTasks.filter(
      (task) => task.status === "done",
    ).length;
    return Math.round((completedTasks / stageTasks.length) * 100);
  };

  const calculateProjectProgress = (): number => {
    const completedTasks = tasks.filter(
      (task) => task.status === "done",
    ).length;
    return tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-500";
      case "inProgress":
        return "bg-yellow-500";
      case "todo":
        return "bg-blue-500";
      case "backlog":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColorMuted = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "inProgress":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "todo":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "backlog":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const criticalInProgress = tasks.filter(
      (t) => t.status === "inProgress" && t.priority === "critical",
    ).length;
    const highDone = tasks.filter(
      (t) => t.status === "done" && t.priority === "high",
    ).length;

    return { totalTasks, doneTasks, criticalInProgress, highDone };
  };

  const TaskDetailsPopover = ({ task }: { task: Task }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-medium">
          {task.title}
          <ChevronRight className="inline-block ml-1 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground">
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(task.status)} text-white`}>
              {task.status}
            </Badge>
            {task.priority && (
              <Badge
                className={`${getPriorityColor(task.priority)} text-white`}
              >
                {task.priority}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
          <p className="text-sm text-muted-foreground">{task.description}</p>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">Assignee:</span>
              </div>
              <p className="text-sm pl-6">{task.assignee.name}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">Reporter:</span>
              </div>
              <p className="text-sm pl-6">{task.reporter?.email || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">Estimated time:</span>
              </div>
              <p className="text-sm pl-6">{task.time} hours</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">Due date:</span>
              </div>
              <p className="text-sm pl-6">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Flag className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">Efforts:</span>
            </div>
            <p className="text-sm pl-6">{task.efforts}</p>
          </div>
          {task.comments && task.comments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium">Comments:</span>
                </div>
                <div className="pl-6 space-y-2">
                  {task.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded"
                    >
                      <p className="font-medium">{comment.author}:</p>
                      <p className="text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
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
      <h1 className="text-3xl font-bold mb-6">
        {project.name} - Project Details
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Progress
                value={calculateProjectProgress()}
                className="w-[80%]"
              />
              <span className="ml-2 font-bold">
                {calculateProjectProgress()}%
              </span>
            </div>
          </CardContent>
        </Card>
        {project.currentStage && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Current Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Progress
                  value={calculateStageProgress()}
                  className="w-[80%]"
                />
                <span className="ml-2 font-bold">
                  {calculateStageProgress()}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Current Stage: {project.currentStage.name} 
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`flex items-center text-xl font-bold ${project.onTrack ? "text-green-600" : "text-red-600"}`}
            >
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
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {project && tasks.length > 0 ? (
              <>
                <div className="text-2xl font-bold mb-2">
                  {getTaskStats().totalTasks} Tasks
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Completed:
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {getTaskStats().doneTasks}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <AlertOctagon className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground mr-2">
                      Critical (In Progress):
                    </span>
                    <Badge variant="destructive">
                      {getTaskStats().criticalInProgress}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground mr-2">
                      High (Completed):
                    </span>
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
                  className={`h-5 w-5 transition-transform duration-200 ${
                    expandedStatuses.includes(status)
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusGroups[status as keyof typeof statusGroups].map(
                        (task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <TaskDetailsPopover task={task} />
                            </TableCell>
                            <TableCell>{task.assignee?.name}</TableCell>
                            <TableCell>
                              <Badge
                                className={`${getStatusColor(task.status)} text-white`}
                              >
                                {task.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-4 w-4" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          </TableRow>
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
                        className={`font-bold ${
                          employee.availability >= 75
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
    </div>
  );
}
