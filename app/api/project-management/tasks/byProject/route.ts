// /app/api/tasks/route.ts
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, setDoc, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Task } from '@/models/task';
import { report } from 'process';
import { randomUUID } from 'crypto';
import { updateProjectStage } from '@/utils/ayncfunctions/addTaskToStage';
import { updateProjectAndStageProgress } from '@/utils/ayncfunctions/updateProgress';

/**
 * Retrieves a list of tasks from the Firestore database based on the provided email query parameter.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing the list of tasks.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  console.log('project id tasks in get tasks by prject api', projectId)
  // if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(tasks);
}
// /**
//  * Updates an existing task in the Firestore database.
//  *
//  * @param request - The incoming HTTP request object containing the task updates.
//  * @returns A JSON response indicating the success of the update operation.
//  */

// export async function PATCH(request: Request) {
//   const { email, id, ...updates }: Partial<Task> & { email: string; id: string } = await request.json();
//   console.log('in api,',email, id, updates);
//   if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

//   const taskRef = doc(db, 'tasks', id);
//   await updateDoc(taskRef, updates);
//   updateProjectAndStageProgress({ ...updates, id } as Task);
//   return NextResponse.json({ success: true });
// }
// /**
//  * Deletes a task from the Firestore database based on the provided email and task ID.
//  *
//  * @param request - The incoming HTTP request object containing the email and task ID.
//  * @returns A JSON response indicating the success of the delete operation.
//  */


// export async function DELETE(request: Request) {
//   const { email, id }: { email: string; id: string } = await request.json();
//   if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
//   console.log('in api,',email, id);
//   const taskRef = doc(db, 'tasks', id);
//   await deleteDoc(taskRef);

//   return NextResponse.json({ success: true });
// }
