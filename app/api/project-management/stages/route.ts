import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { collection, getDocs, setDoc, doc } from 'firebase/firestore'
import { Stage } from '@/models/stage'

// Fetch all stages
export async function GET() {
  try {
    const stagesCollection = collection(db, 'stages')
    const stagesSnapshot = await getDocs(stagesCollection)
    const stages = stagesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(stages)
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 })
  }
}

// Create a new stage
export async function POST(req: Request) {
  try {
    const stage = await req.json() as Omit<Stage, 'id'>
    const stageRef = doc(collection(db, 'stages')) // Auto-generate ID using Firestore
    await setDoc(stageRef, stage)
    return NextResponse.json({ id: stageRef.id, ...stage })
  } catch (error) {
    console.error('Error creating stage:', error)
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 })
  }
}
