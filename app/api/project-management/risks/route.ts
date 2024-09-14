import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Risk } from '@/models/risk';
// Fetch all risks
export async function GET() {
  try {
    const risksCollection = collection(db, 'risks')
    const risksSnapshot = await getDocs(risksCollection)
    const risks = risksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(risks)
  } catch (error) {
    console.error('Error fetching risks:', error)
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 })
  }
}

// Create a new risk
export async function POST(req: Request) {
  try {
    const risk: Omit<Risk, 'id'> = await req.json();
    const riskRef = await addDoc(collection(db, 'risks'), risk)
    return NextResponse.json({ id: riskRef.id, ...risk })
  } catch (error) {
    console.error('Error creating risk:', error)
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 })
  }
}

// Update an existing risk
export async function PATCH(req: Request) {
  try {
    const risk: Risk = await req.json();
    const riskRef = doc(db, 'risks', risk.id)
    await updateDoc(riskRef, risk)
    return NextResponse.json(risk)
  } catch (error) {
    console.error('Error updating risk:', error)
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 })
  }
}

// Delete a risk
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const riskRef = doc(db, 'risks', id)
    await deleteDoc(riskRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting risk:', error)
    return NextResponse.json({ error: 'Failed to delete risk' }, { status: 500 })
  }
}
