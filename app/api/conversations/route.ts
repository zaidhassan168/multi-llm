// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const conversationsRef = collection(db, 'chats', email, 'conversations');
    const snapshot = await getDocs(conversationsRef);
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().messages[0]?.content.slice(0, 30) || 'New Chat'
    }));
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// export async function DELETE(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const email = searchParams.get('email');
//   const conversationId = searchParams.get('conversationId');
//   console.log(email, conversationId);
//   if (!email || !conversationId) {
//     return NextResponse.json({ error: 'Email and conversationId are required' }, { status: 400 });
//   }

//   try {
//     const conversationRef = doc(db, 'chats', email, 'conversations', conversationId);
//     await deleteDoc(conversationRef);
//     return NextResponse.json({ message: 'Conversation deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting conversation:', error);
//     return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
//   }
// }