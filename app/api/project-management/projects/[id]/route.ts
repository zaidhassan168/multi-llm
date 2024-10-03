import { db } from '@/firebase';
import { doc, writeBatch, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { TaskSummary } from '@/models/summaries';
import { Project } from '@/models/project';
import { Stage } from '@/models/stage';
// funtion to add a task to a project
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const projectId = params.id;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Parse the request body to get the new task data
        const { task, stageId } = await request.json();

        if (!task || !stageId) {
            return NextResponse.json({ error: 'Task and Stage ID are required' }, { status: 400 });
        }

        // Get reference to the project document
        const projectDocRef = doc(db, 'projects', projectId);

        // Fetch the current project document
        const projectDoc = await getDoc(projectDocRef);

        if (!projectDoc.exists()) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data() as Project;

        // Start a batch write
        const batch = writeBatch(db);

        // Prepare the task summary
        const taskSummary: TaskSummary = {
            id: task.id,
            title: task.title,
            status: task.status,
            assignee: task.assignee?.name || '',
            time: task.time || 0,
        };

        // Update the project's tasks array (if you want to keep a summary in the main project document)
        const updatedTasks = [...(projectData.tasks || []), taskSummary];
        batch.update(projectDocRef, { tasks: updatedTasks });

        // Get reference to the stage document
        const stageDocRef = doc(db, 'projects', projectId, 'stages', stageId);

        // Fetch the current stage document
        const stageDoc = await getDoc(stageDocRef);

        if (stageDoc.exists()) {
            // Update existing stage
            const stageData = stageDoc.data() as Stage;
            const updatedTaskIds = [...(stageData.taskIds || []), task.id];
            const updatedStageTasks = [...(stageData.tasks || []), taskSummary];
            
            batch.update(stageDocRef, { 
                taskIds: updatedTaskIds,
                tasks: updatedStageTasks
            });
        } else {
            // Create new stage
            const newStage: Stage = {
                id: stageId,
                name: 'New Stage', // You might want to provide a name for the new stage
                owner: '',
                processGroup: 'executing',
                taskIds: [task.id],
                tasks: [taskSummary],
            };
            batch.set(stageDocRef, newStage);
        }

        // Add the full task to the tasks subcollection of the stage
        const taskDocRef = doc(db, 'projects', projectId, 'stages', stageId, 'tasks', task.id);
        batch.set(taskDocRef, task);

        // Commit the batch operation
        await batch.commit();

        // Send success response
        return NextResponse.json({ success: true, message: 'Task added to project and stage' }, { status: 200 });

    } catch (error) {
        console.error('Error adding task to project and stage:', error);
        return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
    }
}

// // write the method to fetch the single  project and  collection stages in its document and collection tasks in its document
// export async function GET(request: Request, { params }: { params: { id: string } }) {
//     try {
//         const projectId = params.id;
//         if (!projectId) {
//             return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
//         }
//         const projectRef = doc(db, 'projects', projectId);
//         const projectDoc = await getDoc(projectRef);
//         if (!projectDoc.exists()) {
//             return NextResponse.json({ error: 'Project not found' }, { status: 404 });
//         }
//         const
//         projectData = projectDoc.data() as Project;
//         const stagesRef = collection(db, 'projects', projectId, 'stages');
//         const stagesSnapshot = await getDocs(stagesRef);
//         const stages = stagesSnapshot.docs.map(doc => doc.data() as Stage);
//         const tasksRef = collection(db, 'projects', projectId, 'stages', stages[0].id, 'tasks')