import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { Stage } from '@/models/stage'

// Update a stage
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const stageData = await req.json() as Partial<Stage>
    const stageRef = doc(db, 'stages', params.id)
    
    // Ensure the document exists before updating
    const stageSnapshot = await getDoc(stageRef)
    if (!stageSnapshot.exists()) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 })
    }

    await updateDoc(stageRef, stageData)
    return NextResponse.json({ id: params.id, ...stageData })
  } catch (error) {
    console.error('Error updating stage:', error)
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })
  }
}

// Delete a stage
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const stageRef = doc(db, 'stages', params.id)
    
    // Ensure the document exists before deleting
    const stageSnapshot = await getDoc(stageRef)
    if (!stageSnapshot.exists()) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 })
    }

    await deleteDoc(stageRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stage:', error)
    return NextResponse.json({ error: 'Failed to delete stage' }, { status: 500 })
  }
}
