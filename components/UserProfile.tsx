import React, { Suspense } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "../firebase";

// This function returns a promise that resolves with the user
function getUserPromise(): Promise<FirebaseUser> {
  return new Promise((resolve, reject) => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error("User not logged in"));
        }
      },
      reject
    );
  });
}

// This component uses the experimental use() hook
function UserData() {
  const user = React.use(getUserPromise());

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

export default function UserProfile() {
  return (
    <Suspense fallback={<div>Loading suspense...</div>}>
      <UserData />
    </Suspense>
  );
}