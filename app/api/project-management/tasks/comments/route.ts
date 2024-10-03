// /app/api/tasks/comments/route.ts
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Comment } from '@/models/task';

export async function PATCH(request: Request) {
  try {
    const { email, taskId, comments }: { email: string; taskId: string; comments: Comment[] } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (!Array.isArray(comments)) {
      return NextResponse.json({ error: 'Comments must be an array' }, { status: 400 });
    }

    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      comments: comments,
      lastUpdated: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task comments:', error);
    return NextResponse.json({ error: 'Failed to update task comments' }, { status: 500 });
  }
}