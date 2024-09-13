import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { firestore } from 'firebase-admin';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

initFirebaseAdmin();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      streak: userData.streak || 0,
      points: userData.points || 0,
      levelProgress: calculateLevelProgress(userData.points || 0),
      tasksCompletedThisWeek: await getTasksCompletedThisWeek(uid),
      rank: calculateRank(userData.points || 0),
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function calculateLevelProgress(points: number): number {
  const levelThreshold = 1000;
  return (points % levelThreshold) / levelThreshold * 100;
}

async function getTasksCompletedThisWeek(uid: string): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const tasksSnapshot = await firestore()
    .collection('tasks')
    .where('assigneeId', '==', uid)
    .where('status', '==', 'done')
    .where('completedAt', '>=', oneWeekAgo)
    .get();

  return tasksSnapshot.size;
}

function calculateRank(points: number): string {
  if (points < 1000) return 'Novice';
  if (points < 5000) return 'Intermediate';
  if (points < 10000) return 'Advanced';
  if (points < 20000) return 'Expert';
  return 'Master';
}