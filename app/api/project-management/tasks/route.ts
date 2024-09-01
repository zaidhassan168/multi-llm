// /app/api/tasks/route.ts
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Task } from '@/models/task';
import { report } from 'process';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, title, description, time, efforts, assignee, status }: Task & { email: string } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const newTask: Task = {
      id: randomUUID(),
      title,
      description,
      time,
      efforts,
      assignee,
      status,
      createdAt: new Date(),
      reporterEmail: email,
    };

    // Create a document reference with the generated ID within the 'tasks' collection
    const taskRef = doc(collection(db, 'tasks'), newTask.id);

    // Save the document in Firestore
    await setDoc(taskRef, newTask);

    return NextResponse.json({ id: newTask.id });
  } catch (error) {  
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  console.log(email);
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const q = query(collection(db, 'tasks'));
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(tasks);
}

export async function PATCH(request: Request) {
  const { email, id, ...updates }: Partial<Task> & { email: string; id: string } = await request.json();
  console.log('in api,',email, id, updates);
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const taskRef = doc(db, 'tasks', id);
  await updateDoc(taskRef, updates);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { email, id }: { email: string; id: string } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const taskRef = doc(db, 'tasks', id);
  await deleteDoc(taskRef);

  return NextResponse.json({ success: true });
}
