// app/api/list-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFiles } from '@/lib/git';

export async function GET() {
  const files = await getFiles('./');

  return NextResponse.json({ files });
}
