// components/TaskModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Task, addTask, updateTask, deleteTask } from "@/models/task";
import {
  CalendarIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  FlagIcon,
  LayersIcon,
  BugIcon,
  LightbulbIcon,
  FileTextIcon,
  CheckSquareIcon,
  RefreshCcwIcon,
  HelpCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  BellIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchProjects } from "@/models/project";
import { fetchEmployees, Employee } from "@/models/employee";
import { EmployeeSummary } from "@/models/summaries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/hooks";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId?: string;
  onTaskAdded?: () => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void; // New optional callback
};
const taskComplexities = ["simple", "moderate", "complex"] as const;
type TaskComplexity = typeof taskComplexities[number];

const priorityIcons: Record<
  string,
  { icon: React.ComponentType<any>; color: string }
> = {
  low: { icon: FlagIcon, color: "text-green-500" },
  medium: { icon: AlertCircleIcon, color: "text-yellow-500" },
  high: { icon: AlertTriangleIcon, color: "text-orange-500" },
  urgent: { icon: AlertOctagonIcon, color: "text-red-500" },
  critical: { icon: BellIcon, color: "text-purple-500" },
  null: { icon: HelpCircleIcon, color: "text-gray-500" },
};

const taskTypeIcons: Record<
  string,
  { icon: React.ComponentType<any>; color: string }
> = {
  bug: { icon: BugIcon, color: "text-red-500" },
  feature: { icon: LightbulbIcon, color: "text-yellow-500" },
  documentation: { icon: FileTextIcon, color: "text-blue-500" },
  task: { icon: CheckSquareIcon, color: "text-green-500" },
  changeRequest: { icon: RefreshCcwIcon, color: "text-purple-500" },
  other: { icon: HelpCircleIcon, color: "text-gray-500" },
};

const complexityIcons: Record<
  string,
  { icon: React.ComponentType<any>; color: string }
> = {
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
};

export function TaskModal({
  isOpen,
  onClose,
  task,
  projectId,
  onTaskAdded,
  onTaskUpdated,
}: TaskModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [projects, setProjects] = useState<
    { id: string; name: string; stages: { id: string; name: string }[] }[]
  >([]);
  const [developers, setDevelopers] = useState<Employee[]>([]);
  const [projectManagers, setProjectManagers] = useState<Employee[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Task, "id">>({
    ...DEFAULT_FORM_DATA,
    projectId: projectId || "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
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
        const pms = employeesData.filter(
          (emp) => emp.role === "projectManager"
        );
        setDevelopers(devs);
        setProjectManagers(pms);

        if (projectId) {
          const selectedProject = projectsData.find((p) => p.id === projectId);
          setStages(selectedProject?.stages || []);
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

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({ ...prev, projectId }));
    const selectedProject = projects.find((p) => p.id === projectId);
    setStages(selectedProject?.stages || []);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
        description:
          "User information is not available. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
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
      setIsProcessing(false);
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

    setIsProcessing(true);
    try {
      await deleteTask(task.id, user.email);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const taskPriorities = ["low", "medium", "high", "urgent", "critical", "null"];
  const taskTypes = [
    "bug",
    "feature",
    "documentation",
    "task",
    "changeRequest",
    "other",
  ];

  if (isLoading) {
    return (
      <Drawer open={isOpen} onClose={onClose}>
        <DrawerContent className="h-[90vh] max-w-4xl mx-auto flex items-center justify-center bg-gray-100">
          <div className="loader">Loading...</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="h-[100vh] max-w-4xl mx-auto p-5 bg-gray-50">
        <DrawerHeader>
          <div className="flex justify-between items-center">
            <DrawerTitle className="text-2xl font-bold text-gray-800">
              {task
                ? isEditMode
                  ? "Edit Task"
                  : "Task Details"
                : "Add New Task"}
            </DrawerTitle>
            <div className="flex items-center space-x-1">
              {task && !isEditMode && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEdit}
                  className="hover:bg-gray-100 rounded-full"
                >
                  <EditIcon className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 rounded-full"
              >
                <XIcon className="h-5 w-5 text-gray-600" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          <DrawerDescription className="text-gray-600">
            {task
              ? isEditMode
                ? "Edit the details of your task."
                : "View task details."
              : "Add a new task to your board."}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center text-red-500">
                <AlertCircleIcon className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 font-semibold">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={!isEditMode}
                className="border-gray-300 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Grid with Three Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Field */}
              <div className="space-y-2">
                <Label htmlFor="projectId" className="text-gray-700 font-semibold">
                  Project
                </Label>
                <Select
                  name="projectId"
                  value={formData.projectId}
                  onValueChange={handleProjectChange}
                  disabled={!isEditMode || !!projectId}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Field */}
              {stages.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="stageId" className="text-gray-700 font-semibold">
                    Stage
                  </Label>
                  <Select
                    name="stageId"
                    value={formData.stageId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, stageId: value }))
                    }
                    disabled={!isEditMode}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Type Field */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700 font-semibold">
                  Type
                </Label>
                <Select
                  name="type"
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as Task["type"] }))
                  }
                  disabled={!isEditMode}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          {React.createElement(taskTypeIcons[type].icon, {
                            className: `h-4 w-4 mr-2 ${taskTypeIcons[type].color}`,
                          })}
                          <span className="capitalize">
                            {type.replace(/([A-Z])/g, " $1")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Complexity Field */}
              <div className="space-y-2">
                <Label htmlFor="complexity" className="text-gray-700 font-semibold">
                  Complexity
                </Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskComplexities.map((complexity) => (
                      <SelectItem key={complexity} value={complexity}>
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

              {/* Time Field */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-gray-700 font-semibold">
                  Time (hours)
                </Label>
                <Input
                  id="time"
                  name="time"
                  type="number"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  disabled={!isEditMode}
                  className="border-gray-300 focus:border-blue-500 bg-white"
                />
              </div>

              {/* Efforts Field */}
              <div className="space-y-2">
                <Label htmlFor="efforts" className="text-gray-700 font-semibold">
                  Efforts
                </Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select efforts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend + frontend">
                      Backend + Frontend
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700 font-semibold">
                  Status
                </Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Field */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-700 font-semibold">
                  Priority
                </Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
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

              {/* Assignee Field */}
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-gray-700 font-semibold">
                  Assignee
                </Label>
                <Select
                  name="assignee"
                  value={formData.assignee.id || ""}
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {developers.map((dev) => (
                      <SelectItem key={dev.id} value={dev.id}>
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

              {/* Reporter Field */}
              <div className="space-y-2">
                <Label htmlFor="reporter" className="text-gray-700 font-semibold">
                  Reporter
                </Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select reporter" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectManagers.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
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

              {/* Due Date Field */}
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-gray-700 font-semibold">
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 focus:border-blue-500 bg-white",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                      disabled={!isEditMode}
                    >
                      {formData.dueDate ? (
                        format(new Date(formData.dueDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.dueDate ? new Date(formData.dueDate) : undefined
                      }
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
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={!isEditMode}
                className="border-gray-300 focus:border-blue-500 h-24 resize-none bg-white"
              />
            </div>

            {/* Action Buttons */}
            {isEditMode && (
              <DrawerFooter>
                <div className="flex flex-col md:flex-row justify-between w-full space-y-4 md:space-y-0">
                  <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 rounded-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <ClockIcon className="animate-spin h-4 w-4" />
                        {task ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        {task ? "Update" : "Add"} Task
                      </>
                    )}
                  </Button>

                  {task && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="flex items-center gap-2 rounded-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <ClockIcon className="animate-spin h-4 w-4" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          Delete Task
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DrawerFooter>
            )}
          </form>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
