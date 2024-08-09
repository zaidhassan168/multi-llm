// app/api/generate-comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateComment } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  const comment = await generateComment(code);

  return NextResponse.json({ comment });
}
