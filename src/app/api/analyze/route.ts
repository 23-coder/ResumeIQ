import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyzeResumeAgainstJob } from '@/lib/ai-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, jobDescriptionId } = body;

    if (!resumeId || !jobDescriptionId) {
      return NextResponse.json(
        { error: 'Resume ID and Job Description ID are required' },
        { status: 400 }
      );
    }

    const resume = await db.resume.findUnique({ where: { id: resumeId } });
    const jobDescription = await db.jobDescription.findUnique({
      where: { id: jobDescriptionId },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description not found' }, { status: 404 });
    }

    // Perform AI analysis
    const analysisResult = await analyzeResumeAgainstJob(
      resume.fileContent,
      jobDescription.content
    );

    // Store the analysis result
    const analysis = await db.analysis.create({
      data: {
        resumeId: resume.id,
        jobDescriptionId: jobDescription.id,
        matchScore: analysisResult.matchScore,
        skillMatch: JSON.stringify(analysisResult.skillMatch),
        skillGap: JSON.stringify(analysisResult.skillGap),
        keywordAnalysis: JSON.stringify(analysisResult.keywordAnalysis),
        suggestions: JSON.stringify(analysisResult.suggestions),
        strengths: JSON.stringify(analysisResult.strengths),
        overallVerdict: analysisResult.overallVerdict,
      },
    });

    return NextResponse.json({
      id: analysis.id,
      ...analysisResult,
      resumeFileName: resume.fileName,
      jobTitle: jobDescription.title,
      createdAt: analysis.createdAt,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again.' },
      { status: 500 }
    );
  }
}
