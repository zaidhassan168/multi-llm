// hooks/useFcmToken.ts
'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/firebase';

export const useFcmToken = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        // Request notification permission from the user
        const permission = await Notification.requestPermission();
        setNotificationPermissionStatus(permission);
        console.log('Notification permission status:', permission);

        if (permission === 'granted') {
          // Initialize Firebase Messaging
          const messaging = getMessaging(app);

          // Register the service worker
          const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registration:', serviceWorkerRegistration);

          // Get the FCM token
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!, // Replace with your VAPID key
            serviceWorkerRegistration,
          });

          if (token) {
            setFcmToken(token);
            // Optionally, send the token to your server for later use
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Notification permission not granted.');
        }
      } catch (error) {
        console.log('Error retrieving token:', error);
      }
    };

    retrieveToken();
  }, []);

  useEffect(() => {
    if (notificationPermissionStatus === 'granted') {

      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground push notification received:', payload);
        // Handle foreground messages here
      });

      return () => {
        unsubscribe(); // Unsubscribe from onMessage when the component unmounts
      };
    }
  }, [notificationPermissionStatus]);

  return { fcmToken, notificationPermissionStatus };
};

export default useFcmToken;
