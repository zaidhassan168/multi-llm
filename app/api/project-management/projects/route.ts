import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

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
    const project = await req.json()
    const projectRef = await addDoc(collection(db, 'projects'), project)
    return NextResponse.json({ id: projectRef.id, ...project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

// Update an existing project
export async function PATCH(req: Request) {
  try {
    const project = await req.json()
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
