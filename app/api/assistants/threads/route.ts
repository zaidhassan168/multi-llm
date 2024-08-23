import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Create a new thread
export async function POST() {
  try {
    const thread = await openai.beta.threads.create();
    return Response.json({ threadId: thread.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
