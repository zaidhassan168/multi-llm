import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase'; // Import your Firestore instance
import { Task } from '@/models/task';
import { Stage } from '@/models/stage';

export async function  updateProjectAndStageProgress(task: Task) {
  try {
    const { projectId, stageId } = task;

    if (!projectId || !stageId) {
      console.log('Project ID or Stage ID is missing');
      return;
    }

    // Fetch all tasks for the project
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );
    const projectTasksSnapshot = await getDocs(tasksQuery);
    const allTasks = projectTasksSnapshot.docs.map(doc => doc.data() as Task);

    // Fetch all tasks for the specific stage
    const stageTasks = allTasks.filter(t => t.stageId === stageId);
    const totalTasks = stageTasks.length;
    const totalTaskHours = stageTasks.reduce((sum, t) => sum + (t.time || 0), 0);

    // Calculate task hours completed based on status and contribution
    const taskHoursCompleted = stageTasks.reduce((sum, t) => {
      const contribution = calculateTaskContribution(t);
      return sum + (t.time || 0) * contribution;
    }, 0);

    // Progress is the total contribution (weighted by hours and status) divided by total task hours
    const progress = totalTaskHours > 0
      ? Math.round((taskHoursCompleted / totalTaskHours) * 100)
      : 0;

    // Update the stage
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      console.log('Project not found');
      return;
    }

    const projectData = projectSnap.data();
    let stages = projectData?.stages || [];
    const stageIndex = stages.findIndex((s: Stage) => s.id === stageId);
    if (stageIndex === -1) {
      console.log('Stage not found in project');
      return;
    }

    const completedTasks = stageTasks.filter(t => t.status === 'done').length;

    // Update the specific stage fields
    stages[stageIndex] = {
      ...stages[stageIndex],
      totalTasks,
      completedTasks,
      totalTaskHours,
      taskHoursCompleted,
      progress, // Calculated progress based on hours and status
    };

    // Calculate the project-wide fields
    const projectTotalTasks = allTasks.length;
    const projectCompletedTasks = allTasks.filter(t => t.status === 'done').length;
    const projectIncompleteTasks = allTasks.filter(t => t.status !== 'done').length;
    const projectOverdueTasks = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'done').length;
    const projectOnTrackTasks = allTasks.filter(t => t.status === 'inProgress' || t.status === 'todo').length;
    const projectTotalTaskHours = allTasks.reduce((sum, t) => sum + (t.time || 0), 0);
    const projectTaskHoursCompleted = allTasks.reduce((sum, t) => {
      const contribution = calculateTaskContribution(t);
      return sum + (t.time || 0) * contribution;
    }, 0);

    const projectProgress = projectTotalTaskHours > 0
      ? Math.round((projectTaskHoursCompleted / projectTotalTaskHours) * 100)
      : 0;

    // Update the project document
    await updateDoc(projectRef, {
      stages,
      totalTasks: projectTotalTasks,
      totalTasksCompleted: projectCompletedTasks,
      totalTasksIncomplete: projectIncompleteTasks,
      totalTasksOverdue: projectOverdueTasks,
      totalTasksOnTrack: projectOnTrackTasks,
      totalTasksHours: projectTotalTaskHours,
      tasksHoursCompleted: projectTaskHoursCompleted,
      progress: projectProgress, // Project-wide progress
    });

    console.log('Project and stage progress successfully updated');
  } catch (error) {
    console.error('Error updating project and stage:', error);
  }
}

// Helper function to calculate task contribution based on status
function calculateTaskContribution(task: Task): number {
  switch (task.status) {
    case 'done':
      return 1; // Fully completed task
    case 'inProgress':
      return 0.5; // Halfway completed for inProgress tasks (or adjust based on your needs)
    case 'todo':
      return 0.25; // Partially considered for todo tasks (could be 0 or other value depending on your use case)
    case 'backlog':
      return 0; // No progress for backlog tasks
    default:
      return 0;
  }
}
