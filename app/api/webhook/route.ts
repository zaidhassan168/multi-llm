// pages/api/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { value } = req.body;

    // Example: Process the received notifications
    value.forEach(async (event: any) => {
      // Check if it's a new event or an update
      const { resourceData } = event;

      // You can create a task in your app based on the received calendar event
      const task = {
        title: resourceData.subject,
        description: resourceData.bodyPreview,
        startTime: resourceData.start.dateTime,
        endTime: resourceData.end.dateTime,
        attendees: resourceData.attendees,
      };

      // Save the task to your database (example for Firebase Firestore)
      // const db = getFirestore();
      // await addDoc(collection(db, 'tasks'), task);

      console.log('Task created:', task);
    });

    res.status(200).send('Notification received');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
