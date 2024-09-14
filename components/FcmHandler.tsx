// components/FcmHandler.tsx
'use client';

import { useEffect } from 'react';
import useFcmToken from '@/lib/hooks/useFcmToken';

export const FcmHandler = () => {
  const { fcmToken } = useFcmToken();

  return (
    <div>
      {fcmToken ? (
        <p>Your FCM Token: {fcmToken}</p>
      ) : (
        <p>Fetching FCM Token...</p>
      )}
    </div>
  );
};
