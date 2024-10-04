// /app/api/tasks/route.ts
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, setDoc, where, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Task } from '@/models/task';
import { report } from 'process';
import { randomUUID } from 'crypto';
import { updateProjectStage } from '@/utils/ayncfunctions/addTaskToStage';
import { updateProjectAndStageProgress } from '@/utils/ayncfunctions/updateProgress';

/**
 * Retrieves a single task from the Firestore database based on the provided taskId query parameter.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing the requested task.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  console.log('fetching single task', taskId)
  
  if (!taskId) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });

  // fetch task using id 
  const taskRef = doc(db, 'tasks', taskId);
  const taskSnapshot = await getDoc(taskRef);

  if (!taskSnapshot.exists()) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = { id: taskSnapshot.id, ...taskSnapshot.data() };

  return NextResponse.json(task);
}
