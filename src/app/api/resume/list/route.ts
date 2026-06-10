import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const resumes = await db.resume.findMany({
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Resume list error:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}
