import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { email: string } }) {
  try {
    const email = params.email;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    console.log("tasks by email", email, role);

    let q;
    if (role === 'projectManager') {
      q = query(collection(db, 'tasks'), where('reporterEmail', '==', email));
    } else if (role === 'developer') {
      q = query(collection(db, 'tasks'), where('assigneeEmail', '==', email));
    } else if (role === 'management') {
      q = query(collection(db, 'tasks'));
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // console.log("tasks", tasks);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}