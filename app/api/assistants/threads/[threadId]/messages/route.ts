import { assistantId } from "@/app/assistant-config";
import { openai } from "@/app/openai";

export const runtime = "nodejs";
export const maxDuration = 30;// Send a new message to a thread
export async function POST(request: Request, { params: { threadId } }: { params: { threadId: string } }) {
  console.log(`Received POST request for thread: ${threadId}`);

  try {
    const { content } = await request.json();
    console.log(`Message content: ${content}`);

    console.log('Creating message in thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content,
    });
    console.log('Message created successfully');

    console.log(`Streaming run for thread ${threadId} with assistant ${assistantId}`);
    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
    });

    console.log('Returning stream response');
    return new Response(stream.toReadableStream());
  } catch (error) {
    console.error('Error in POST handler:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error in route file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
