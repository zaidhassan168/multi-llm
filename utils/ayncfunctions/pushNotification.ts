import { Task } from "@/models/task";
import { toast } from "@/components/ui/use-toast";
import { title } from "process";
export async function taskUpdateNotification(task: Task) {
    fetch('/api/notify', {
        method: 'POST',
        body: JSON.stringify({
            userId: task?.assignee?.id, // ID of the user to notify
            taskId: task.id, // ID of the task being updated
            taskTitle: task.title, // Title of the task being updated
            newStatus: task.status,
            messageBody: `Task ${task.title} has been updated to ${task.status}`,
            title: 'Task Update',
            // New status of the task
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Notification sent:', data);
        })
        .catch((error) => {
            console.error('Error sending notification:', error);
        });
    toast({
        title: 'Success',
        description: 'Task updated successfully',
    });

}


export async function taskDependencyNotification(tasks: Task[], addedBy: string) {

    tasks.forEach((task) => {
        fetch('/api/notify', {
            method: 'POST',
            body: JSON.stringify({
                userId: task?.assignee?.id, // ID of the user to notify
                taskId: task.id, // ID of the task being updated
                taskTitle: task.title, // Title of the task being updated
                newStatus: task.status,
                messageBody: `Yor task ${task.title} has been added as a dependency for task by ${addedBy}`,
                title: 'Task Update',
                // New status of the task
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Notification sent:', data);
            })
            .catch((error) => {
                console.error('Error sending notification:', error);
            });
    });
}