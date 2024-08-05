import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "../firebase";

export default function UserProfile() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {user.uid}</p>
      <p>Email: {user.email}</p>
      <p>Display Name: {user.displayName}</p>
      {/* Add more user properties as needed */}
    </div>
  );
}