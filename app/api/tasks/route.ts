// /app/api/tasks/route.ts
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Task } from '@/types/tasks';

export async function POST(request: Request) {
  const { email, title, description, time, efforts, assignee, status }: Task & { email: string } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const docRef = await addDoc(collection(db, 'kanban', email, 'tasks'), {
    title,
    description,
    time,
    efforts,
    assignee,
    status,
    createdAt: new Date(),
  });

  return NextResponse.json({ id: docRef.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  console.log(email);
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const q = query(collection(db, 'kanban', email, 'tasks'));
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(tasks);
}

export async function PATCH(request: Request) {
  const { email, id, ...updates }: Partial<Task> & { email: string; id: string } = await request.json();
  console.log(email, id, updates);
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const taskRef = doc(db, 'kanban', email, 'tasks', id);
  await updateDoc(taskRef, updates);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { email, id }: { email: string; id: string } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const taskRef = doc(db, 'kanban', email, 'tasks', id);
  await deleteDoc(taskRef);

  return NextResponse.json({ success: true });
}
