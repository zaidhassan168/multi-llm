"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Task, addTask, updateTask, deleteTask, fetchTasksByProject } from "@/models/task"
import { CalendarIcon, EditIcon, SaveIcon, XIcon, TrashIcon,SearchIcon ,ClockIcon, UserIcon, FlagIcon, LayersIcon, BugIcon, LightbulbIcon, FileTextIcon, CheckSquareIcon, RefreshCcwIcon, HelpCircleIcon, AlertCircleIcon, AlertTriangleIcon, AlertOctagonIcon, BellIcon, LinkIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchProjects } from "@/models/project"
import { fetchEmployees, Employee } from "@/models/employee"
import { EmployeeSummary } from "@/models/summaries"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import LottieLoading from "./LottieLoading"

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId?: string;
  onTaskAdded?: () => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
};

const taskComplexities = ["simple", "moderate", "complex"] as const;
type TaskComplexity = typeof taskComplexities[number];

const priorityIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  low: { icon: FlagIcon, color: "text-green-500" },
  medium: { icon: AlertCircleIcon, color: "text-yellow-500" },
  high: { icon: AlertTriangleIcon, color: "text-orange-500" },
  urgent: { icon: AlertOctagonIcon, color: "text-red-500" },
  critical: { icon: BellIcon, color: "text-purple-500" },
  null: { icon: HelpCircleIcon, color: "text-gray-500" },
};

const taskTypeIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  bug: { icon: BugIcon, color: "text-red-500" },
  feature: { icon: LightbulbIcon, color: "text-yellow-500" },
  documentation: { icon: FileTextIcon, color: "text-blue-500" },
  task: { icon: CheckSquareIcon, color: "text-green-500" },
  changeRequest: { icon: RefreshCcwIcon, color: "text-purple-500" },
  other: { icon: HelpCircleIcon, color: "text-gray-500" },
};

const complexityIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  simple: { icon: CheckSquareIcon, color: "text-green-500" },
  moderate: { icon: AlertCircleIcon, color: "text-yellow-500" },
  complex: { icon: AlertTriangleIcon, color: "text-red-500" },
};

const DEFAULT_FORM_DATA: Omit<Task, "id"> = {
  title: "",
  description: "",
  time: 0,
  efforts: "backend",
  assignee: {} as EmployeeSummary,
  status: "backlog",
  createdAt: new Date(),
  projectId: "",
  reporter: {} as EmployeeSummary,
  priority: "low",
  dueDate: undefined,
  comments: [],
  stageId: "",
  type: "task",
  complexity: "moderate",
  dependencies: { taskIds: [] },
};

export function TaskModal({
  isOpen,
  onClose,
  task,
  projectId,
  onTaskAdded,
  onTaskUpdated,
  onTaskDeleted,
}: TaskModalProps) {
  const [isEditMode, setIsEditMode] = useState(!task);
  const [projects, setProjects] = useState<{ id: string; name: string; stages: { id: string; name: string }[] }[]>([]);
  const [developers, setDevelopers] = useState<Employee[]>([]);
  const [projectManagers, setProjectManagers] = useState<Employee[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Task, "id">>(DEFAULT_FORM_DATA);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          ...task,
          complexity: task.complexity || "moderate",
        });
        setIsEditMode(false);
      } else {
        setFormData({
          ...DEFAULT_FORM_DATA,
          projectId: projectId || "",
        });
        setIsEditMode(true);
      }
    }
  }, [task, isOpen, projectId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [projectsData, employeesData] = await Promise.all([
          fetchProjects(),
          fetchEmployees(),
        ]);
        setProjects(
          projectsData.map((p) => ({
            id: p.id,
            name: p.name,
            stages: p.stages?.map((stage) => ({
              id: stage.id,
              name: stage.name,
            })) || [],
          }))
        );

        const devs = employeesData.filter((emp) => emp.role === "developer");
        const pms = employeesData.filter((emp) => emp.role === "projectManager");
        setDevelopers(devs);
        setProjectManagers(pms);

        const currentProjectId = task?.projectId || projectId;
        if (currentProjectId) {
          const selectedProject = projectsData.find((p) => p.id === currentProjectId);
          if (selectedProject) {
            setStages(selectedProject.stages || []);
            if (task && task.stageId) {
              setFormData(prev => ({
                ...prev,
                stageId: task.stageId
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load projects and employees data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      setIsLoading(true);
      fetchInitialData();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (formData.projectId) {
        try {
          // Assuming you have a function to fetch tasks for a specific project
          const tasks = await fetchTasksByProject(formData.projectId);
          setProjectTasks(tasks);
        } catch (error) {
          console.error("Error fetching project tasks:", error);
          setError("Failed to load project tasks");
        }
      }
    };

    fetchProjectTasks();
  }, [formData.projectId]);

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({ ...prev, projectId }));
    const selectedProject = projects.find((p) => p.id === projectId);
    setStages(selectedProject?.stages || []);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "time" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast({
        title: "Error",
        description: "User information is not available. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      if (task) {
        await updateTask({ ...formData, id: task.id } as Task, user.email);
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
        onTaskUpdated?.();
      } else {
        const newTask = await addTask(formData, user.email);
        toast({
          title: "Success",
          description: "New task added successfully",
        });
        onTaskAdded?.();
      }
      setIsEditMode(false);
      onClose();
    } catch (error) {
      console.error("Error processing task:", error);
      toast({
        title: "Error",
        description: `Failed to ${task ? "update" : "add"} task`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.email || !task) {
      toast({
        title: "Error",
        description: "User information or task data is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(task.id, user.email);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTaskDeleted?.();
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDependencyChange = (taskId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dependencies: {
        taskIds: isChecked
          ? [...(prev.dependencies?.taskIds || []), taskId]
          : (prev.dependencies?.taskIds || []).filter(id => id !== taskId)
      }
    }));
  };

  const filteredTasks = projectTasks.filter(t =>
    t.id !== task?.id && // Exclude the current task
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const taskPriorities = ["low", "medium", "high", "urgent", "critical", "null"];
  const taskTypes = ["bug", "feature", "documentation", "task", "changeRequest", "other"];

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] h-[95vh] p-0">
          <div className="flex items-center justify-center h-full">
            <LottieLoading size="small" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[95vh] p-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <ScrollArea className="h-full px-6 py-4">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-primary">
              {task ? (isEditMode ? "Edit Task" : "Task Details") : "Add New Task"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {task
                ? isEditMode
                  ? "Edit the details of your task."
                  : "View task details."
                : "Add a new task to your board."}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
              <TabsTrigger value="description" className="text-sm">Description</TabsTrigger>
              <TabsTrigger value="dependencies" className="text-sm">Dependencies</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-primary">Task Information</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Enter the main details of the task.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={!isEditMode}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectId" className="text-sm font-medium">Project</Label>
                      <Select
                        name="projectId"
                        value={formData.projectId}
                        onValueChange={handleProjectChange}
                        disabled={!isEditMode || !!projects}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id} className="text-sm">
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {stages.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="stageId" className="text-sm font-medium">Stage</Label>
                        <Select
                          name="stageId"
                          value={formData.stageId}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, stageId: value }))
                          }
                          disabled={!isEditMode}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id} className="text-sm">
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                      <Select
                        name="type"
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, type: value as Task["type"] }))
                        }
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypes.map((type) =>
                            <SelectItem key={type} value={type} className="text-sm">
                              <div className="flex items-center">
                                {React.createElement(taskTypeIcons[type].icon, {
                                  className: `h-4 w-4 mr-2 ${taskTypeIcons[type].color}`,
                                })}
                                <span className="capitalize">
                                  {type.replace(/([A-Z])/g, " $1")}
                                </span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                      <Select
                        name="priority"
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            priority: value as Task["priority"],
                          }))
                        }
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskPriorities.map((priority) => (
                            <SelectItem key={priority} value={priority} className="text-sm">
                              <div className="flex items-center">
                                {React.createElement(priorityIcons[priority].icon, {
                                  className: `h-4 w-4 mr-2 ${priorityIcons[priority].color}`,
                                })}
                                <span className="capitalize">{priority}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complexity" className="text-sm font-medium">Complexity</Label>
                      <Select
                        name="complexity"
                        value={formData.complexity}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            complexity: value as TaskComplexity,
                          }))
                        }
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select complexity" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskComplexities.map((complexity) => (
                            <SelectItem key={complexity} value={complexity} className="text-sm">
                              <div className="flex items-center">
                                {React.createElement(complexityIcons[complexity].icon, {
                                  className: `h-4 w-4 mr-2 ${complexityIcons[complexity].color}`,
                                })}
                                <span className="capitalize">{complexity}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignee" className="text-sm font-medium">Assignee</Label>
                      <Select
                        name="assignee"
                        value={formData?.assignee?.id || ""}
                        onValueChange={(value) => {
                          const selectedDev = developers.find((dev) => dev.id === value);
                          if (selectedDev) {
                            setFormData((prev) => ({
                              ...prev,
                              assignee: {
                                id: selectedDev.id,
                                name: selectedDev.name,
                                email: selectedDev.email,
                                role: selectedDev.role,
                              },
                            }));
                          }
                        }}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {developers.map((dev) => (
                            <SelectItem key={dev.id} value={dev.id} className="text-sm">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage
                                    src={dev.photoURL || "/placeholder.svg"}
                                    alt={dev.name}
                                  />
                                  <AvatarFallback>{dev.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {dev.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporter" className="text-sm font-medium">Reporter</Label>
                      <Select
                        name="reporter"
                        value={formData.reporter?.id || ""}
                        onValueChange={(value) => {
                          const selectedPM = projectManagers.find((pm) => pm.id === value);
                          if (selectedPM) {
                            setFormData((prev) => ({
                              ...prev,
                              reporter: {
                                id: selectedPM.id,
                                name: selectedPM.name,
                                email: selectedPM.email,
                                role: selectedPM.role,
                              },
                            }));
                          }
                        }}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select reporter" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectManagers.map((pm) => (
                            <SelectItem key={pm.id} value={pm.id} className="text-sm">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage
                                    src={pm.photoURL || "/placeholder.svg"}
                                    alt={pm.name}
                                  />
                                  <AvatarFallback>{pm.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {pm.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select
                        name="status"
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: value as Task["status"],
                          }))
                        }
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog" className="text-sm">Backlog</SelectItem>
                          <SelectItem value="todo" className="text-sm">To Do</SelectItem>
                          <SelectItem value="inProgress" className="text-sm">In Progress</SelectItem>
                          <SelectItem value="done" className="text-sm">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-10 justify-start text-left font-normal text-sm",
                              !formData.dueDate && "text-muted-foreground"
                            )}
                            disabled={!isEditMode}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dueDate ? format(new Date(formData.dueDate), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                            onSelect={(date) =>
                              setFormData((prev) => ({
                                ...prev,
                                dueDate: date ? new Date(date) : undefined,
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="efforts" className="text-sm font-medium">Efforts</Label>
                      <Select
                        name="efforts"
                        value={formData.efforts}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            efforts: value as Task["efforts"],
                          }))
                        }
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select efforts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backend" className="text-sm">Backend</SelectItem>
                          <SelectItem value="frontend" className="text-sm">Frontend</SelectItem>
                          <SelectItem value="backend + frontend" className="text-sm">Backend + Frontend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm font-medium">Time (hours)</Label>
                      <Input
                        id="time"
                        name="time"
                        type="number"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        disabled={!isEditMode}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="description">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-primary">Task Description</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Provide a detailed description of the task.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    disabled={!isEditMode}
                    className="min-h-[200px] text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="dependencies">
  <Card className="border-none shadow-md">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg font-semibold text-primary">Task Dependencies</CardTitle>
      <CardDescription className="text-xs text-muted-foreground">Select tasks that this task depends on.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="dependency-search"
            placeholder="Search tasks by title or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 text-sm pl-10"
          />
        </div>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          {filteredTasks.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No tasks found matching your search.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <Card key={t.id} className="m-2 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      id={`task-${t.id}`}
                      checked={formData.dependencies?.taskIds.includes(t.id)}
                      onCheckedChange={(checked) => handleDependencyChange(t.id, checked as boolean)}
                      disabled={!isEditMode}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`task-${t.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t.title}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {t.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{t.dueDate ? format(new Date(t.dueDate), 'PP') : 'No due date'}</span>
                        </div>
                        <div className="flex items-center">
                          <Avatar className="h-4 w-4 mr-1">
                            <AvatarImage src={t.assignee?.phtoURL || "/placeholder.svg"} alt={t.assignee?.name} />
                            <AvatarFallback>{t.assignee?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span>{t.assignee?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center">
                          {React.createElement(priorityIcons[t.priority || 'null'].icon, {
                            className: `h-3 w-3 mr-1 ${priorityIcons[t.priority || 'null'].color}`,
                          })}
                          <span className="capitalize">{t.priority || 'No priority'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </ScrollArea>
        {formData.dependencies?.taskIds && formData.dependencies.taskIds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Dependencies</Label>
            <div className="flex flex-wrap gap-2">
              {formData.dependencies.taskIds.map((taskId) => {
                const dependentTask = projectTasks.find(t => t.id === taskId);
                return (
                  <Badge key={taskId} variant="secondary" className="text-xs">
                    {dependentTask ? dependentTask.title : taskId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>
          </Tabs>
          <div className="flex justify-between mt-6 space-x-4">
            {isEditMode ? (
              <>
                <Button onClick={handleSubmit} disabled={isUpdating} className="bg-primary hover:bg-primary/90 flex-1">
                  {isUpdating ? (
                    <>
                      <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                      {task ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      {task ? "Update" : "Add"} Task
                    </>
                  )}
                </Button>
                {task && (
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
                    {isDeleting ? (
                      <>
                        <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete Task
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={handleEdit} className="bg-primary hover:bg-secondary flex-1">
                <EditIcon className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}