import React, { useState } from 'react';
import { Task } from '@/types/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type TaskCardProps = {
  task: Task;
  onUpdateTask: (updatedTask: Task) => void;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTask }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [taskDetails, setTaskDetails] = useState(task);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFlashMessage(null);

    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskDetails),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setFlashMessage({ type: 'success', message: 'Task updated successfully!' });
        onUpdateTask(updatedTask);
        setModalOpen(false);
      } else {
        const errorData = await response.json();
        setFlashMessage({ type: 'error', message: `Error: ${errorData.message}` });
      }
    } catch (error) {
      setFlashMessage({ type: 'error', message: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`});
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-white p-3 rounded-lg shadow-sm mb-4 cursor-pointer"
      >
        <h3 className="text-sm font-semibold mb-1">{task.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {task.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {task.time} hours | {task.efforts} | {task.assignee}
        </p>
      </div>

      <Dialog open={isModalOpen} onOpenChange={() => setModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Modify the details of your task and save changes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={taskDetails.title}
                  onChange={(e) => setTaskDetails({ ...taskDetails, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  required
                  value={taskDetails.description}
                  onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time (hours)
                </Label>
                <Input
                  id="time"
                  type="number"
                  required
                  value={taskDetails.time}
                  onChange={(e) => setTaskDetails({ ...taskDetails, time: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="efforts" className="text-right">
                  Efforts
                </Label>
                <Input
                  id="efforts"
                  type="text"
                  required
                  value={taskDetails.efforts}
                  onChange={(e) => setTaskDetails({ ...taskDetails, efforts: e.target.value as Task['efforts'] })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">
                  Assignee
                </Label>
                <Input
                  id="assignee"
                  type="text"
                  required
                  value={taskDetails.assignee}
                  onChange={(e) => setTaskDetails({ ...taskDetails, assignee: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            {flashMessage && (
              <div className={`text-sm ${flashMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {flashMessage.message}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;
