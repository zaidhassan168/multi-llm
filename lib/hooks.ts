import { useState, useEffect } from 'react';
import { getAuth, User } from 'firebase/auth';
import { app } from '@/firebase';

const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false); // Set loading to false once the user data is available
    });

    return () => unsubscribe();
  }, []);

  return { user, loading }; // Return loading state along with the user
}
