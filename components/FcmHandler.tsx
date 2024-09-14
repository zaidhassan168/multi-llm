// components/FcmHandler.tsx
'use client';

import { useState, useEffect } from 'react';
import useFcmToken from '@/lib/hooks/useFcmToken';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have a useAuth hook

export const FcmHandler = () => {
  const [permissionRequested, setPermissionRequested] = useState(false);
  const { fcmToken, notificationPermissionStatus } = useFcmToken(permissionRequested);
  const { user } = useAuth(); // Get the current authenticated user

  useEffect(() => {
    // Automatically request permission when the user is authenticated
    if (user && !permissionRequested) {
      setPermissionRequested(true); // Trigger the FCM token retrieval
    }
  }, [user, permissionRequested]);

  useEffect(() => {
    // Handle denied permission case if necessary (e.g., log, alert)
    if (notificationPermissionStatus === 'denied') {
      console.warn('Notifications are blocked. Please enable them in your browser settings.');
    }
  }, [notificationPermissionStatus]);

  return null; // No UI needed for this component
};

export default FcmHandler;
