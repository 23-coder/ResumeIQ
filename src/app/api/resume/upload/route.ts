import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const textContent = await extractTextFromPDF(buffer);

    if (!textContent || textContent.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the PDF. Please ensure it contains readable text.' },
        { status: 400 }
      );
    }

    const resume = await db.resume.create({
      data: {
        fileName: file.name,
        fileContent: textContent,
      },
    });

    return NextResponse.json({
      id: resume.id,
      fileName: resume.fileName,
      textPreview: textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''),
      charCount: textContent.length,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume. Please try again.' },
      { status: 500 }
    );
  }
}
