import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore'
import { Project } from '@/models/project'
import { Stage } from '@/models/stage';
import { StageSummary } from '@/models/summaries';
import { Console } from 'console';

// Fetch all projects
export async function GET() {
  try {
    const projectsCollection = collection(db, 'projects')
    // const stagesCollection = collection(db, 'projects', 'CUoQzHAT4p1VtPTex6oA', 'stages')
    // const stagesSnapshot = await getDocs(stagesCollection)
    // const stages = stagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const projectsSnapshot = await getDocs(projectsCollection)
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // console.log("stages", stages); 
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
    // console.log("projectData", projectData);

    // Start a new batch
    const batch = writeBatch(db);

    // Generate a document reference with a new unique ID for the project
    const projectRef = doc(collection(db, 'projects'));
    const projectId = projectRef.id;

    // Prepare the project data
    const project: Project = {
      ...projectData,
      id: projectId,
      stages: projectData.stages || [], // Initialize with an empty array of stages
      resources: projectData.resources || [], // Initialize with an empty array of resources
      tasks: [], // Initialize with an empty array of task summaries
    };

    // Set the project data in the batch
    batch.set(projectRef, project);

    // If there's an initial stage in the project data, create it as a subcollection
    // if (projectData.stages && projectData.stages.length > 0) {
    //   const initialStage = projectData.stages[0];
    //   console.log("initialStage", initialStage);
    //   const stageRef = doc(collection(db, 'projects', projectId, 'stages'));
    //   const stage: Stage = {
    //     ...initialStage,
    //     taskIds: [],
    //     tasks: [],
    //   };

    //   // Set the initial stage data in the batch
    //   batch.set(stageRef, stage);

    //   // Update the project with the current stage reference
    //   batch.update(projectRef, { 
    //     currentStage: {
    //       id: stage.id,
    //       name: stage.name,
    //     }
    //   });
    // }

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
    console.log("project", project);
    const projectRef = doc(db, 'projects', project.id)
    await updateDoc(projectRef, project)
    if (project.stages && project.stages.length > 0) {
      const stagesCollectionRef = collection(projectRef, 'stages'); // Reference to the stages sub-collection

      // Add each stage with auto-generated Firebase doc ID
      await Promise.all(
        project.stages.map(async (stage: Stage) => {
          await addDoc(stagesCollectionRef, stage); // Add stage with auto-generated ID
        })
      );
    }

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
