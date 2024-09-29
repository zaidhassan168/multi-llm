import { getAuth } from 'firebase/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { useAuth } from '@/contexts/AuthContext';
// Fetch calendar events after the user logs in
async function fetchCalendarEvents() {
  // const auth = getAuth(app);
  const { user } = useAuth();
  
  if (user) {
    const idToken = await user.getIdToken();
    
    // Create a Microsoft Graph client using the access token
    const client = Client.init({
      authProvider: (done) => {
        done(null, idToken); // Pass the token to the Graph client
      },
    });

    try {
      // Fetch the calendar events from Microsoft Graph API
      const events = await client.api('/me/events').get();
      console.log('Fetched calendar events:', events);
      
      // You can now process these events and store them in your Firestore DB
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  }
}

export { fetchCalendarEvents };