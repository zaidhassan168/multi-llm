import { FunctionDeclarationSchemaType, HarmBlockThreshold, HarmCategory, VertexAI } from '@google-cloud/vertexai';
import { NextRequest, NextResponse } from 'next/server';

const project = 'lithe-land-427409-d7';
const location = 'us-central1';
const textModel = 'gemini-1.5-flash-001';

const vertex_ai = new VertexAI({ project: 'lithe-land-427409-d7', location: 'us-central1' });
const model = 'gemini-1.5-flash-001';

// Initialize the model
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  }
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const req = {
      contents: [
        { role: 'user', parts: [{ text: messages[messages.length - 1].content }] }
      ],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    const responseChunks = [];
    for await (const item of streamingResp.stream) {
      responseChunks.push(item);
      process.stdout.write('stream chunk: ' + JSON.stringify(item) + '\n');
    }

    const aggregatedResponse = await streamingResp.response;
    process.stdout.write('aggregated response: ' + JSON.stringify(aggregatedResponse));

    return NextResponse.json({ response: aggregatedResponse });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
