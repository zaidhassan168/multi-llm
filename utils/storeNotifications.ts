// app/utils/storeNotification.ts

import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';
import { app } from '../firebase'; // Adjust this import path as needed

interface Notification {
  title: string;
  message: string;
  read: boolean;
  timestamp: object;
}

export async function storeNotification(userId: string, title: string, message: string): Promise<void> {
  try {
    console.log('Storing notification for user:', userId);
    const db = getDatabase(app);
    const notificationsRef = ref(db, `notifications/${userId}`);
    console
    const newNotification: Notification = {
      title,
      message,
      read: false,
      timestamp: serverTimestamp(),
    };

    await push(notificationsRef, newNotification);
    console.log('Notification stored successfully');
  } catch (error) {
    console.error('Error storing notification:', error);
    throw error;
  }
}

interface ComTask {
  id: string;
  title: string;
  // Add other properties as needed
}

interface CommentNotification {
  type: 'comment';
  task?: ComTask;
  commentId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentionedUserId?: string;
  timestamp: object;
  read?: boolean;
}

interface Employee {
  id: string;
  name: string;
  // Add other properties as needed
}

export async function storeCommentNotification(
  taskId: string,
  taskTitle: string,
  commentId: string,
  authorId: string,
  authorName: string,
  content: string,
  mentionedUsers: string[],
  employees: Employee[]
): Promise<void> {
  try {
    const db = getDatabase(app);

    for (const mentionedUser of mentionedUsers) {
      const mentionedEmployee = employees.find(emp => emp.name === mentionedUser);
      if (mentionedEmployee) {
        const notificationsRef = ref(db, `commentNotifications/${mentionedEmployee.id}`);

        const newNotification: CommentNotification = {
          type: 'comment',
          task: {
            id: taskId,
            title: taskTitle,
          },
          commentId,
          authorId,
          authorName,
          content,
          mentionedUserId: mentionedEmployee.id,
          timestamp: serverTimestamp(),
          read: false,
        };

        await push(notificationsRef, newNotification);
        console.log(`Comment notification stored successfully for user ${mentionedEmployee.id}`);
      }
    }
  } catch (error) {
    console.error('Error storing comment notifications:', error);
    throw error;
  }
}

export type {CommentNotification}