import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const analysis = await db.analysis.findUnique({
        where: { id },
        include: {
          resume: { select: { fileName: true } },
          jobDescription: { select: { title: true } },
        },
      });

      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: analysis.id,
        matchScore: analysis.matchScore,
        skillMatch: JSON.parse(analysis.skillMatch),
        skillGap: JSON.parse(analysis.skillGap),
        keywordAnalysis: JSON.parse(analysis.keywordAnalysis),
        suggestions: JSON.parse(analysis.suggestions),
        strengths: JSON.parse(analysis.strengths),
        overallVerdict: analysis.overallVerdict,
        resumeFileName: analysis.resume.fileName,
        jobTitle: analysis.jobDescription.title,
        createdAt: analysis.createdAt,
      });
    }

    // Get all analyses
    const analyses = await db.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        resume: { select: { fileName: true } },
        jobDescription: { select: { title: true } },
      },
      take: 20,
    });

    const results = analyses.map((a) => ({
      id: a.id,
      matchScore: a.matchScore,
      overallVerdict: a.overallVerdict,
      resumeFileName: a.resume.fileName,
      jobTitle: a.jobDescription.title,
      createdAt: a.createdAt,
      skillMatch: JSON.parse(a.skillMatch),
      skillGap: JSON.parse(a.skillGap),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}
