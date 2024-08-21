import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { db } from '@/firebase'
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore'
import { NextResponse } from 'next/server'

async function saveChat(userId: string, conversationId: string, message: any) {
  await addDoc(collection(db, 'messages'), {
    userId,
    conversationId,
    content: message.content,
    role: message.role,
    timestamp: new Date(),
  });
}

async function getConversationHistory(userId: string, conversationId: string) {
  const q = query(
    collection(db, 'messages'),
    where('userId', '==', userId),
    where('conversationId', '==', conversationId),
    orderBy('timestamp')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function POST(req: Request) {
  const { messages, userId, conversationId } = await req.json();

  // Get a language model
  const model = google('models/gemini-1.5-flash-latest')

  // Call the language model with the prompt
  const result = await streamText({
    model,
    messages,
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.4,
    async onFinish({ text }) {
      // Save the assistant's response
      await saveChat(userId, conversationId, { role: 'assistant', content: text });
    },
  });

  // Save the user's message
  await saveChat(userId, conversationId, messages[messages.length - 1]);

  // Respond with a streaming response
  return result.toAIStreamResponse()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const conversationId = searchParams.get('conversationId');

  if (!userId || !conversationId) {
    return NextResponse.json({ error: 'Missing userId or conversationId' }, { status: 400 });
  }

  try {
    const history = await getConversationHistory(userId, conversationId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 });
  }
}
