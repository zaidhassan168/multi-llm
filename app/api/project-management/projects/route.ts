import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore'
import { Project } from '@/models/project'
import { Stage } from '@/models/stage';

// Fetch all projects
export async function GET() {
  try {
    const projectsCollection = collection(db, 'projects')
    const projectsSnapshot = await getDocs(projectsCollection)
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// Create a new project
export async function POST(req: Request) {
  try {
    const projectData: Omit<Project, 'id'> = await req.json();

    // Start a new batch
    const batch = writeBatch(db);

    // Generate a document reference with a new unique ID for the project
    const projectRef = doc(collection(db, 'projects'));
    const projectId = projectRef.id;

    // Prepare the project data
    const project: Project = {
      ...projectData,
      id: projectId,
      tasks: [], // Initialize with an empty array of task summaries
    };

    // Set the project data in the batch
    batch.set(projectRef, project);

    // If there's an initial stage in the project data, create it as a subcollection
    if (projectData.stages && projectData.stages.length > 0) {
      const initialStage = projectData.stages[0];
      const stageRef = doc(collection(db, 'projects', projectId, 'stages'));
      const stage: Stage = {
        ...initialStage,
        id: stageRef.id,
        taskIds: [],
        tasks: [],
      };

      // Set the initial stage data in the batch
      batch.set(stageRef, stage);

      // Update the project with the current stage reference
      batch.update(projectRef, { 
        currentStage: {
          id: stage.id,
          name: stage.name,
        }
      });
    }

    // Commit the batch
    await batch.commit();

    // Return the project data including the generated ID
    return NextResponse.json({ ...project, stages: projectData.stages });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// Update an existing project
export async function PATCH(req: Request) {
  try {
    const project: Project = await req.json();
    const projectRef = doc(db, 'projects', project.id)
    await updateDoc(projectRef, project)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// Delete a project
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const projectRef = doc(db, 'projects', id)
    await deleteDoc(projectRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
