// utils/timestampConverter.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Firestore Timestamp or plain timestamp object to a JavaScript Date.
 * @param {Timestamp | { seconds: number; nanoseconds: number } | Date} timestamp - The timestamp to convert.
 * @returns {Date | null} - JavaScript Date object or null if conversion fails.
 */
export const convertToDate = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | Date | undefined
): Date | null => {
  if (!timestamp) return null;

  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a Firestore Timestamp
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // If it's a plain object with seconds and nanoseconds
  if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6);
  }

  console.error('Unknown timestamp format:', timestamp);
  return null;
};
export const convertToDateTime = (
    timestamp: Timestamp | { seconds: number; nanoseconds: number } | Date | undefined
  ): string => {
    if (!timestamp) return '';
  
    let dateObj: Date;
  
    // If it's already a Date object
    if (timestamp instanceof Date) {
      dateObj = timestamp;
    }
    // If it's a Firestore Timestamp object
    else if (timestamp instanceof Timestamp) {
      dateObj = timestamp.toDate();
    }
    // If it's a plain object with seconds and nanoseconds
    else if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
      dateObj = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6);
    } else {
      console.error('Unknown timestamp format:', timestamp);
      return '';
    }
  
    // Format the date as DD/MM/YYYY
    const formattedDate = dateObj.toLocaleDateString('en-GB'); // Using 'en-GB' for DD/MM/YYYY format
  
    // Format the time as HH:mm (24-hour format without seconds)
    const formattedTime = dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Ensures 24-hour format
    });
  
    // Return combined date and time in the format "DD/MM/YYYY, HH:mm"
    return `${formattedDate} ${formattedTime}`;
  };