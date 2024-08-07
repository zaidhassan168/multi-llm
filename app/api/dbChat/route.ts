import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.MINDSDB_API_KEY;
  const url = 'https://llm.mdb.ai/chat/completions';

  try {
    const { messages } = await req.json();

    const body = JSON.stringify({
      model: 'driver_mind',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        ...messages,
      ],
      stream: false,
    });
    console.log(body);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body,
    });
    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling MindsDB API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
