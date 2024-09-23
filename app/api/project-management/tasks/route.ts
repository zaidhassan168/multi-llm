// /app/api/tasks/route.ts
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Task } from '@/models/task';

import { updateProjectStage } from '@/utils/ayncfunctions/addTaskToStage';
import { updateProjectAndStageProgress } from '@/utils/ayncfunctions/updateProgress';
/**
 * Creates a new task in the Firestore database.
 *
 * @param request - The incoming HTTP request object containing the task data.
 * @returns A JSON response containing the ID of the newly created task.
 */
export async function POST(request: Request) {
  try {
     const { task, email }: { task: Omit<Task, 'id'>, email: string } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create a document reference without an ID (Firestore will generate it)
    const taskRef = doc(collection(db, 'tasks'));

    const newTask: Task = {
      ...task,
      id: taskRef.id, // Use the auto-generated ID
      createdAt: new Date(),
    };

    // Save the document in Firestore
    await setDoc(taskRef, newTask);
    updateProjectStage(newTask);
    return NextResponse.json({ id: newTask.id });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

/**
 * Retrieves a list of tasks from the Firestore database based on the provided email query parameter.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing the list of tasks.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  console.log(email);
  // if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const q = query(collection(db, 'tasks'));
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(tasks);
}
/**
 * Updates an existing task in the Firestore database.
 *
 * @param request - The incoming HTTP request object containing the task updates.
 * @returns A JSON response indicating the success of the update operation.
 */

export async function PATCH(request: Request) {
  const { email, id, ...updates }: Partial<Task> & { email: string; id: string } = await request.json();
  console.log('in api,',email, id, updates);
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const taskRef = doc(db, 'tasks', id);
  await updateDoc(taskRef, updates);
  updateProjectAndStageProgress({ ...updates, id } as Task);
  return NextResponse.json({ success: true });
}
/**
 * Deletes a task from the Firestore database based on the provided email and task ID.
 *
 * @param request - The incoming HTTP request object containing the email and task ID.
 * @returns A JSON response indicating the success of the delete operation.
 */


export async function DELETE(request: Request) {
  const { email, id }: { email: string; id: string } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  console.log('in api,',email, id);
  const taskRef = doc(db, 'tasks', id);
  await deleteDoc(taskRef);

  return NextResponse.json({ success: true });
}
