import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Project } from '@/models/project'

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params
    // console.log('Received request to fetch project with ID:', request)

    const projectRef = doc(db, 'projects', projectId)
    const projectSnapshot = await getDoc(projectRef)

    if (!projectSnapshot.exists()) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectSnapshot.data() 
    // console.log("here is the project ", project)

    console.log('Project fetched successfully:', project.id)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}