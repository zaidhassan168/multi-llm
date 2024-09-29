import { Client } from '@microsoft/microsoft-graph-client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = req.body; // Get the access token of the logged-in user
  
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken); // Pass the access token
    },
  });

  try {
    const subscription = await client
      .api('/subscriptions')
      .post({
        changeType: 'created,updated,deleted',
        notificationUrl: 'https://yourapp.com/api/webhook', // Your webhook endpoint
        resource: 'me/events',
        expirationDateTime: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
        clientState: 'random-string',
      });

    res.status(200).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}
