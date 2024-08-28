// app/api/chat/route.ts
import { db } from '@/firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { Message } from 'ai/react';
async function saveChat(email: string, conversationId: string, message: Message) {
  if (!email || !conversationId) {
    console.error('Invalid email or conversationId:', { email, conversationId });
    throw new Error('Invalid email or conversationId');
  }

  try {
    const chatRef = doc(db, 'chats', email, 'conversations', conversationId);

    await setDoc(
      chatRef,
      {
        messages: arrayUnion({ ...message }),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, email, conversationId, selectedModel } = await req.json();
    console.log('messages', messages)
    if (!email || !conversationId) {
      console.error('Missing email or conversationId in POST request');
      return NextResponse.json({ error: 'Missing email or conversationId' }, { status: 400 });
    }

    let model, modelName;

    // Select the appropriate model based on the frontend selection
    if (selectedModel === 'gemini') {
      model = google('models/gemini-1.5-flash-latest');
      modelName = 'gemini-1.5-flash';
    } else if (selectedModel === 'chatgpt') {
      model = openai('gpt-4o');
      modelName = 'gpt-4o';
    } else {
      return NextResponse.json({ error: 'Invalid model selected' }, { status: 400 });
    }

    const result = await streamText({
      model,
      messages,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.4,
      async onFinish({ text }) {
        await saveChat(email, conversationId, { id: crypto.randomUUID(), role: 'assistant', content: text, createdAt: new Date(), data: { model: modelName } });
      },
    });

    await saveChat(email, conversationId, { ...messages[messages.length - 1], id: crypto.randomUUID(), createdAt: new Date(), data: { model: modelName } });
    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
