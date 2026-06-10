export interface AnalysisResult {
  matchScore: number;
  skillMatch: string[];
  skillGap: string[];
  keywordAnalysis: { keyword: string; resumeCount: number; jdCount: number }[];
  suggestions: string[];
  strengths: string[];
  overallVerdict: string;
}

const getApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not set. Please add it to your .env file. ' +
      'Get a free key at: https://console.groq.com/keys'
    );
  }
  return apiKey;
};

export async function analyzeResumeAgainstJob(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const apiKey = getApiKey();

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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';

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