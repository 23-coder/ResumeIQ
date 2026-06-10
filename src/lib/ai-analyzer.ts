import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnalysisResult {
  matchScore: number;
  skillMatch: string[];
  skillGap: string[];
  keywordAnalysis: { keyword: string; resumeCount: number; jdCount: number }[];
  suggestions: string[];
  strengths: string[];
  overallVerdict: string;
}

// Initialize Gemini API with environment variable
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add it to your .env file. ' +
      'Get a free key at: https://aistudio.google.com/app/apikey'
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

export async function analyzeResumeAgainstJob(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
    },
  });

  const prompt = `You are an expert resume screener and career advisor. Analyze the following resume against the job description and provide a detailed assessment.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide your analysis as a JSON object with exactly these fields:
1. "matchScore": A number from 0-100 representing how well the resume matches the job description.
2. "skillMatch": An array of strings listing skills present in BOTH the resume and job description.
3. "skillGap": An array of strings listing skills required in the job description but MISSING from the resume.
4. "keywordAnalysis": An array of objects, each with "keyword" (string), "resumeCount" (number of times it appears in resume), "jdCount" (number of times it appears in job description). Include the top 8-10 most important keywords.
5. "suggestions": An array of 4-6 specific, actionable suggestions for improving the resume for this job.
6. "strengths": An array of 3-5 specific strengths of the resume relative to this job.
7. "overallVerdict": One of "Excellent Match", "Good Match", "Fair Match", or "Poor Match".

Be thorough and specific. Return ONLY the JSON object, no markdown or explanation.`;

  const result = await model.generateContent([
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ]);

  const response = result.response;
  const responseText = response.text();

  // Clean up response - remove markdown code blocks if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      matchScore: Number(parsed.matchScore) || 0,
      skillMatch: Array.isArray(parsed.skillMatch) ? parsed.skillMatch : [],
      skillGap: Array.isArray(parsed.skillGap) ? parsed.skillGap : [],
      keywordAnalysis: Array.isArray(parsed.keywordAnalysis) ? parsed.keywordAnalysis : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      overallVerdict: parsed.overallVerdict || 'Fair Match',
    };
  } catch {
    console.error('Failed to parse AI response:', cleaned);
    // Fallback with basic analysis
    return {
      matchScore: 50,
      skillMatch: [],
      skillGap: [],
      keywordAnalysis: [],
      suggestions: ['Could not generate detailed suggestions. Please try again.'],
      strengths: [],
      overallVerdict: 'Fair Match',
    };
  }
}
