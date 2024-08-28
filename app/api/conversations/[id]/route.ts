// app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = params.id;

  if (!email || !id) {
    return NextResponse.json({ error: 'Email and conversation ID are required' }, { status: 400 });
  }

  try {
    const conversationRef = doc(db, 'chats', email, 'conversations', id);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      return NextResponse.json(conversationDoc.data().messages || []);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = params.id;
  const { message } = await request.json();

  if (!email || !id || !message) {
    return NextResponse.json({ error: 'Email, conversation ID, and message are required' }, { status: 400 });
  }

  try {
    const conversationRef = doc(db, 'chats', email, 'conversations', id);
    await setDoc(conversationRef, {
      messages: arrayUnion(message)
    }, { merge: true });

    return NextResponse.json({ message: 'Message added successfully' });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  console.log(searchParams);
  const email = searchParams.get('email');
  const conversationId = params.id;
  console.log(email, conversationId);
  if (!email || !conversationId) {
    return NextResponse.json({ error: 'Email and conversationId are required' }, { status: 400 });
  }

  try {
    const conversationRef = doc(db, 'chats', email, 'conversations', conversationId);
    await deleteDoc(conversationRef);
    return NextResponse.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}