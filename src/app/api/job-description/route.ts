import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (content.length < 20) {
      return NextResponse.json({ error: 'Job description is too short' }, { status: 400 });
    }

    const jobDescription = await db.jobDescription.create({
      data: { title, content },
    });

    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Job description creation error:', error);
    return NextResponse.json({ error: 'Failed to create job description' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobDescriptions = await db.jobDescription.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(jobDescriptions);
  } catch (error) {
    console.error('Job description list error:', error);
    return NextResponse.json({ error: 'Failed to fetch job descriptions' }, { status: 500 });
  }
}
