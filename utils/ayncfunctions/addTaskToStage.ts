import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { TaskSummary } from '@/models/summaries';
 // Import your Firestore instance

// Background task that updates the project's stage with the new task ID
export async function updateProjectStage(task: any) {
  try {
    const { projectId, stageId, id: taskId } = task;

    if (!projectId || !stageId || !taskId) {
      console.log('Missing task data');
      return;
    }

    // Get the project document reference
    const projectRef = doc(db, 'projects', projectId);

    // Fetch the existing project data
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      console.log('Project not found');
      return;
    }
    
    const projectData = projectSnap.data();
    let stages = projectData?.stages || []; 
    //also add the task id to array of task ids in the project document
     //merege in taskids array of prject
     let taskIds = projectData?.taskIds || [];
     if (!taskIds.includes(taskId)) {
      taskIds.push(taskId);
    }
    // Find the stage in the stages array by the stageId
    const stageIndex = stages.findIndex((stage: any) => stage.id === stageId);
    if (stageIndex === -1) {
      console.log('Stage not found in project');
      return;
    }

    // Get the stage and update its taskIds array manually
    let stage = stages[stageIndex];
    stage.taskIds = stage.taskIds || [];

    // Add the task ID if it's not already present
    if (!stage.taskIds.includes(taskId)) {
      stage.taskIds.push(taskId);
    }

    // Replace the updated stage back into the stages array
    stages[stageIndex] = stage;

    // Update the Firestore project document with the updated stages array
    await updateDoc(projectRef, {
      stages: stages,
      taskIds: taskIds
      // Update the entire stages array with the modified stage
    });

    console.log('Successfully updated project and stage with new task ID');
  } catch (error) {
    console.error('Error updating project and stage:', error);
  }
}
