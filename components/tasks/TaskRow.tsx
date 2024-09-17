import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Clock } from "lucide-react";
import TaskDetailsPopover from "@/components/tasks/TaskDetailsPopover";
import { Task } from "@/models/task";

const TaskRow = ({ task, handleEditTask }: { task: Task, handleEditTask: (task: Task) => void }) => {
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

  return (
    <TableRow key={task.id}>
      <TableCell>
        <TaskDetailsPopover task={task} />
      </TableCell>
      <TableCell>{task.assignee?.name}</TableCell>
      <TableCell>
        <Badge className={`${getStatusColor(task.status)} text-white`}>
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
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEditTask(task)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default TaskRow;