// app/api/notifyTaskUpdate/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import type { NextRequest } from 'next/server';
import { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    const serviceAccount = {
        type: process.env.FIREBASE_TYPE!,
        project_id: process.env.FIREBASE_PROJECT_ID!,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
        client_email: process.env.FIREBASE_CLIENT_EMAIL!,
        client_id: process.env.FIREBASE_CLIENT_ID!,
        auth_uri: process.env.FIREBASE_AUTH_URI!,
        token_uri: process.env.FIREBASE_TOKEN_URI!,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL!,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL!,
      };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

const db = admin.firestore();

// Specify runtime as 'nodejs' to use Node.js APIs
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, taskId, taskTitle, newStatus } = await request.json();

    // Basic validation
    if (!userId || !taskId || !taskTitle || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the user's FCM tokens from Firestore
    const userDoc = await db.collection('usersTokens').doc(userId).get();
    const userData = userDoc.data();
    console.log('User data:', userData);
    if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'FCM tokens not found for user' },
        { status: 404 }
      );
    }

    const fcmTokens: string[] = userData.fcmTokens;

    // Create the notification message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: 'Task Updated',
        body: `Your task "${taskTitle}" status changed to ${newStatus}.`,
      },
      tokens: fcmTokens,
    };

    // Send the notification to all tokens
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('Successfully sent notifications:', response);
response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`Error sending to token ${fcmTokens[idx]}:`, resp.error);
      }
    });
    // Handle invalid tokens (optional)
    const tokensToRemove: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          tokensToRemove.push(fcmTokens[idx]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await db.collection('usersTokens').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
      });
      console.log('Removed invalid tokens:', tokensToRemove);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
