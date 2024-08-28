import { NextRequest, NextResponse } from 'next/server';
import { Message } from "ai";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    const model = openai('gpt-4o');
    const prompt = `Generate a name for this conversation. Onlu reply generated name wihtout any quotes: ${messages.map(message => message.content).join(' ')}`;

    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 10,
      temperature: 0.7,
      topP: 0.4,
    });
    console.log('Generated conversation name:', text);
    return NextResponse.json({ conversationName: text.trim() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate conversation name' }, { status: 500 });
  }
}
