import { streamText, convertToCoreMessages } from 'ai'
import { google } from '@ai-sdk/google'
import { db } from '@/firebase'
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { NextResponse } from 'next/server'
import { Message } from 'ai/react'
async function saveChat(email: string, conversationId: string, message: Message, conversationName: string) {
  if (!email || !conversationId) {
    console.error('Invalid email or conversationId:', { email, conversationId });
    throw new Error('Invalid email or conversationId');
  }

  try {
    const chatRef = doc(db, 'chats', email, 'conversations', conversationId);

    await setDoc(chatRef, {
      messages: arrayUnion(message),
      name: conversationName || message.content.slice(0, 30)
    }, { merge: true });
    console.log('message',arrayUnion(message) )

  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, email, conversationId, conversationName } = await req.json();

    if (!email || !conversationId) {
      console.log('email:', email)
      console.log('conversationId:', conversationId);
      console.error('Missing email or conversationId in POST request');
      return NextResponse.json({ error: 'Missing email or conversationId' }, { status: 400 });
    }

    // Get a language model
    const model = google('models/gemini-1.5-flash-latest')
    console.log('messages', messages)
    // Call the language model with the prompt
    const result = await streamText({
      model,
      messages: convertToCoreMessages(messages),
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.4,
      async onFinish({ text }) {
        // Save the assistant's response
        await saveChat(email, conversationId, { id: crypto.randomUUID(), role: 'assistant', content: text, createdAt: new Date(), data: { model: 'gemini-1.5-flash' } },conversationName );
      },
    });

    // Save the user's message
    await saveChat(email, conversationId, { ...messages[messages.length - 1], id: crypto.randomUUID(), timestamp: new Date(), data: { model: 'gemini-1.5-flash' } }, conversationName);

    // Respond with a streaming response
    return result.toAIStreamResponse()
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}