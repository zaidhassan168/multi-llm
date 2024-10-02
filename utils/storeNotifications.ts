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