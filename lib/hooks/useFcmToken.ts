// hooks/useFcmToken.ts
'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/firebase'
import { getFirestore, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
const firestore = getFirestore(app);

export const useFcmToken = (permissionRequested: boolean) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission>('default');
  const { user } = useAuth(); // Get the current authenticated user

  useEffect(() => {
    if (permissionRequested && user) {
      const retrieveToken = async () => {
        try {
          console.log('Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('Notification permission status:', permission);
          setNotificationPermissionStatus(permission);

          if (permission === 'granted') {
            console.log('Initializing Firebase Messaging...');
            const messaging = getMessaging(app);

            console.log('Registering service worker...');
            const serviceWorkerRegistration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js'
            );
            console.log('Service Worker registered:', serviceWorkerRegistration);

            console.log('Fetching FCM token...');
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
              serviceWorkerRegistration,
            });

            if (token) {
              console.log('FCM Token retrieved:', token);
              setFcmToken(token);

              // Save the token to Firestore
              const userDocRef = doc(firestore, 'usersTokens', user.uid);
              await setDoc(userDocRef, { fcmTokens: arrayUnion(token) }, { merge: true });
              console.log('FCM token saved to Firestore.');
            } else {
              console.log('No registration token available.');
            }
          } else {
            console.log('Notification permission not granted.');
          }
        } catch (error) {
          console.log('Error retrieving token:', error);
        }
      };

      retrieveToken();
    }
  }, [permissionRequested, user]);

  useEffect(() => {
    if (notificationPermissionStatus === 'granted' && user && fcmToken) {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground push notification received:', payload);
        // Handle foreground messages here (e.g., display a toast)
      });

      return () => {
        unsubscribe(); // Unsubscribe from onMessage when the component unmounts
      };
    }
  }, [notificationPermissionStatus, user, fcmToken]);

  return { fcmToken, notificationPermissionStatus };
};

export default useFcmToken;
