import { useState, useEffect } from 'react';
import { getAuth, User } from 'firebase/auth';
import { app } from '@/firebase';

const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  return { user };
}
