import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, User, Clock, Calendar, Flag, MessageSquare } from "lucide-react";
import { Task } from "@/models/task";
import { getStatusColor, getPriorityColor } from "@/lib/colors/colors";
const TaskDetailsPopover = ({ task }: { task: Task }) => {

  return (
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
              <Badge className={`${getPriorityColor(task.priority)} text-white`}>
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
              <p className="text-sm pl-6">{task.assignee?.name || 'Unknown'}</p>
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
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
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
                    <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
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
};

export default TaskDetailsPopover;
