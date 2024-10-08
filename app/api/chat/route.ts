import { convertToCoreMessages, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const { text } = await generateText({
    model: openai('o1-mini'),
    messages: convertToCoreMessages(messages),
  });
  console.log('text', text);
  return new Response(text);
}