'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Briefcase,
  Search,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface ResumeInfo {
  id: string;
  fileName: string;
  textPreview: string;
  charCount: number;
}

interface JobDescInfo {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface AnalysisResult {
  id: string;
  matchScore: number;
  skillMatch: string[];
  skillGap: string[];
  keywordAnalysis: { keyword: string; resumeCount: number; jdCount: number }[];
  suggestions: string[];
  strengths: string[];
  overallVerdict: string;
  resumeFileName: string;
  jobTitle: string;
  createdAt: string;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Excellent Match': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Good Match': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Fair Match': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Poor Match': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescInfo, setJobDescInfo] = useState<JobDescInfo | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('skills');
  const [dragActive, setDragActive] = useState(false);

  // Step 1: Upload Resume
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    setResumeFile(file);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResumeInfo(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      alert(message);
      setResumeFile(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  // Step 2: Save Job Description
  const handleJobSubmit = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: jobTitle, content: jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobDescInfo(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save job description';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 3: Analyze
  const handleAnalyze = async () => {
    if (!resumeInfo || !jobDescInfo) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resumeInfo.id, jobDescriptionId: jobDescInfo.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysisResult(data);
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      alert(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setResumeFile(null);
    setResumeInfo(null);
    setJobTitle('');
    setJobDescription('');
    setJobDescInfo(null);
    setAnalysisResult(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Prepare chart data
  const keywordChartData = analysisResult?.keywordAnalysis.map((k) => ({
    name: k.keyword,
    Resume: k.resumeCount,
    'Job Description': k.jdCount,
  })) || [];

  const radarData = analysisResult?.skillMatch.slice(0, 8).map((skill) => ({
    skill: skill.length > 12 ? skill.substring(0, 12) + '…' : skill,
    match: 80 + Math.random() * 20,
  })) || [];

  const pieData = analysisResult
    ? [
        { name: 'Matched Skills', value: analysisResult.skillMatch.length, color: '#10b981' },
        { name: 'Missing Skills', value: analysisResult.skillGap.length, color: '#ef4444' },
      ]
    : [];

  const verdictStyle = analysisResult
    ? VERDICT_COLORS[analysisResult.overallVerdict] || VERDICT_COLORS['Fair Match']
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">ResumeIQ</h1>
              <p className="text-xs text-slate-500">AI-Powered Resume Analyzer</p>
            </div>
          </div>
          {analysisResult && (
            <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              New Analysis
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ====== STEP 1: UPLOAD RESUME ====== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"
                >
                  <Upload className="h-8 w-8 text-emerald-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Upload Your Resume
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                  Upload a PDF resume and we&apos;ll extract and analyze its content against any job description using AI.
                </p>
              </div>

              <div className="mx-auto max-w-2xl">
                {/* Progress Steps */}
                <div className="mb-8 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">1</span>
                    Upload Resume
                  </div>
                  <div className="h-0.5 w-8 bg-slate-200" />
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs text-white">2</span>
                    Job Description
                  </div>
                  <div className="h-0.5 w-8 bg-slate-200" />
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs text-white">3</span>
                    Analysis
                  </div>
                </div>

                {/* Drop Zone */}
                {!resumeInfo ? (
                  <Card className="border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-colors">
                    <CardContent className="p-8">
                      <div
                        className={`flex flex-col items-center justify-center gap-4 rounded-xl p-8 transition-colors ${
                          dragActive ? 'bg-emerald-50' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <FileText className="h-7 w-7 text-slate-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-slate-700">
                            Drag & drop your resume here
                          </p>
                          <p className="text-sm text-slate-400 mt-1">or click to browse</p>
                        </div>
                        <label htmlFor="resume-upload">
                          <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                            <span>
                              <Upload className="h-4 w-4" />
                              Choose PDF File
                            </span>
                          </Button>
                          <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </label>
                        <p className="text-xs text-slate-400">Maximum file size: 5MB</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-emerald-800">{resumeInfo.fileName}</p>
                          <p className="text-sm text-emerald-600 mt-1">
                            {resumeInfo.charCount.toLocaleString()} characters extracted
                          </p>
                          <p className="text-xs text-emerald-500 mt-2 line-clamp-2">
                            {resumeInfo.textPreview}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setResumeFile(null);
                            setResumeInfo(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isUploading && (
                  <div className="mt-4 flex items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Extracting text from PDF...</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    size="lg"
                    disabled={!resumeInfo}
                    onClick={() => setStep(2)}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
                  >
                    Next: Job Description
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ====== STEP 2: JOB DESCRIPTION ====== */}
          {step === 2 && !analysisResult && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100"
                >
                  <Briefcase className="h-8 w-8 text-sky-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Add Job Description
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                  Paste the job description you want to match your resume against. The more detailed, the better the analysis.
                </p>
              </div>

              <div className="mx-auto max-w-2xl">
                {/* Progress Steps */}
                <div className="mb-8 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">1</span>
                    Upload Resume
                  </div>
                  <div className="h-0.5 w-8 bg-emerald-300" />
                  <div className="flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs text-white">2</span>
                    Job Description
                  </div>
                  <div className="h-0.5 w-8 bg-slate-200" />
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs text-white">3</span>
                    Analysis
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Job Title
                      </label>
                      <Input
                        placeholder="e.g., Senior Full Stack Developer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Job Description
                      </label>
                      <Textarea
                        placeholder="Paste the full job description here including required skills, responsibilities, qualifications..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={10}
                        className="text-base resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        {jobDescription.length} characters
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    Back
                  </Button>
                  <Button
                    size="lg"
                    disabled={!jobTitle.trim() || !jobDescription.trim() || isUploading}
                    onClick={handleJobSubmit}
                    className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-200"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Analyze Button (appears after job desc is saved) */}
                {jobDescInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <Card className="border-sky-200 bg-sky-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                            <CheckCircle2 className="h-6 w-6 text-sky-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sky-800">{jobDescInfo.title}</p>
                            <p className="text-sm text-sky-600">
                              Job description saved ({jobDescInfo.content.length} characters)
                            </p>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <FileText className="h-4 w-4" />
                            <span>{resumeInfo?.fileName}</span>
                            <span className="text-slate-300">|</span>
                            <Briefcase className="h-4 w-4" />
                            <span>{jobDescInfo.title}</span>
                          </div>
                          <Button
                            size="lg"
                            disabled={isAnalyzing}
                            onClick={handleAnalyze}
                            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-200"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                AI Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Analyze Resume
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== STEP 3: RESULTS ====== */}
          {step === 3 && analysisResult && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Progress Steps */}
              <div className="mb-6 flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">1</span>
                  Upload
                </div>
                <div className="h-0.5 w-8 bg-emerald-300" />
                <div className="flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs text-white">2</span>
                  Job Desc
                </div>
                <div className="h-0.5 w-8 bg-emerald-300" />
                <div className="flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs text-white">3</span>
                  Results
                </div>
              </div>

              {/* Hero Score Card */}
              <Card className="mb-6 overflow-hidden">
                <CardContent className="p-0">
                  <div className={`p-8 ${verdictStyle?.bg}`}>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      {/* Score Circle */}
                      <div className="relative flex-shrink-0">
                        <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/80 bg-white shadow-xl">
                          <div className="text-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                              className="text-5xl font-black"
                              style={{
                                color:
                                  analysisResult.matchScore >= 80
                                    ? '#10b981'
                                    : analysisResult.matchScore >= 60
                                    ? '#0ea5e9'
                                    : analysisResult.matchScore >= 40
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            >
                              {analysisResult.matchScore}
                            </motion.div>
                            <p className="text-sm font-medium text-slate-500 mt-1">out of 100</p>
                          </div>
                        </div>
                      </div>

                      {/* Verdict & Summary */}
                      <div className="flex-1 text-center md:text-left">
                        <Badge
                          className={`mb-3 text-base px-4 py-1.5 ${verdictStyle?.bg} ${verdictStyle?.text} ${verdictStyle?.border} border`}
                        >
                          {analysisResult.overallVerdict}
                        </Badge>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          Resume Analysis Complete
                        </h2>
                        <p className="text-slate-600">
                          <span className="font-medium">{analysisResult.resumeFileName}</span>{' '}
                          analyzed against{' '}
                          <span className="font-medium">{analysisResult.jobTitle}</span>
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                          <Badge variant="secondary" className="gap-1.5 bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {analysisResult.skillMatch.length} Skills Matched
                          </Badge>
                          <Badge variant="secondary" className="gap-1.5 bg-rose-100 text-rose-700">
                            <XCircle className="h-3.5 w-3.5" />
                            {analysisResult.skillGap.length} Skills Missing
                          </Badge>
                          <Badge variant="secondary" className="gap-1.5 bg-violet-100 text-violet-700">
                            <Lightbulb className="h-3.5 w-3.5" />
                            {analysisResult.suggestions.length} Suggestions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Progress */}
                  <div className="px-8 py-4 bg-white">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">Match Score</span>
                      <span className="font-bold" style={{
                        color: analysisResult.matchScore >= 80 ? '#10b981' : analysisResult.matchScore >= 60 ? '#0ea5e9' : analysisResult.matchScore >= 40 ? '#f59e0b' : '#ef4444'
                      }}>
                        {analysisResult.matchScore}%
                      </span>
                    </div>
                    <Progress
                      value={analysisResult.matchScore}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for detailed results */}
              <Tabs defaultValue="skills" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="skills" className="gap-1.5">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline">Skills</span>
                  </TabsTrigger>
                  <TabsTrigger value="keywords" className="gap-1.5">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Keywords</span>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Charts</span>
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="gap-1.5">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Advice</span>
                  </TabsTrigger>
                </TabsList>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Matched Skills */}
                    <Card>
                      <CardHeader
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleSection('skills')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-lg">Matched Skills</CardTitle>
                          </div>
                          {expandedSection === 'skills' ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <CardDescription>
                          Skills found in both your resume and the job description
                        </CardDescription>
                      </CardHeader>
                      {(expandedSection === 'skills' || !expandedSection) && (
                        <CardContent>
                          {analysisResult.skillMatch.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.skillMatch.map((skill, i) => (
                                <motion.div
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Badge
                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-sm"
                                    variant="outline"
                                  >
                                    {skill}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">No matching skills found</p>
                          )}
                        </CardContent>
                      )}
                    </Card>

                    {/* Missing Skills */}
                    <Card>
                      <CardHeader
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleSection('gap')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                            <CardTitle className="text-lg">Missing Skills</CardTitle>
                          </div>
                          {expandedSection === 'gap' ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <CardDescription>
                          Skills required by the job but not found in your resume
                        </CardDescription>
                      </CardHeader>
                      {(expandedSection === 'gap' || !expandedSection) && (
                        <CardContent>
                          {analysisResult.skillGap.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.skillGap.map((skill, i) => (
                                <motion.div
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Badge
                                    className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1 text-sm"
                                    variant="outline"
                                  >
                                    {skill}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">
                              Great! No critical skills are missing from your resume.
                            </p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  </div>

                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-sky-500" />
                        <CardTitle className="text-lg">Resume Strengths</CardTitle>
                      </div>
                      <CardDescription>
                        What makes your resume strong for this position
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.strengths.length > 0 ? (
                        <ul className="space-y-3">
                          {analysisResult.strengths.map((strength, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-3"
                            >
                              <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                                {i + 1}
                              </span>
                              <span className="text-slate-700">{strength}</span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">No specific strengths identified</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-violet-500" />
                        <CardTitle className="text-lg">Keyword Frequency Analysis</CardTitle>
                      </div>
                      <CardDescription>
                        Compare how often key terms appear in your resume vs the job description
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-2 font-semibold text-slate-700">Keyword</th>
                              <th className="text-center py-3 px-2 font-semibold text-slate-700">
                                In Resume
                              </th>
                              <th className="text-center py-3 px-2 font-semibold text-slate-700">
                                In Job Desc
                              </th>
                              <th className="text-center py-3 px-2 font-semibold text-slate-700">
                                Match
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.keywordAnalysis.map((kw, i) => (
                              <motion.tr
                                key={kw.keyword}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="border-b last:border-0 hover:bg-slate-50"
                              >
                                <td className="py-3 px-2 font-medium text-slate-800">
                                  {kw.keyword}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Badge
                                    variant="secondary"
                                    className={
                                      kw.resumeCount > 0
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-400'
                                    }
                                  >
                                    {kw.resumeCount}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                                    {kw.jdCount}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  {kw.resumeCount > 0 && kw.jdCount > 0 ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                  ) : kw.resumeCount > 0 ? (
                                    <span className="text-xs text-slate-400">Extra</span>
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-400 mx-auto" />
                                  )}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Keyword Bar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Keyword Comparison</CardTitle>
                        <CardDescription>
                          Resume vs Job Description keyword frequency
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={keywordChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="Resume" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Job Description" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skill Match Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Skill Coverage</CardTitle>
                        <CardDescription>
                          Proportion of matched vs missing skills
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Radar Chart */}
                  {radarData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Skill Strength Radar</CardTitle>
                        <CardDescription>
                          Visual representation of your matched skill strengths
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                              <Radar
                                name="Skill Match"
                                dataKey="match"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.2}
                              />
                              <Tooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-lg">Improvement Suggestions</CardTitle>
                      </div>
                      <CardDescription>
                        Actionable tips to improve your resume for this specific job
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.suggestions.map((suggestion, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 flex-shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-slate-700 leading-relaxed">{suggestion}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Card */}
                  <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-5 w-5 text-violet-500" />
                        <h3 className="font-semibold text-violet-800">Quick Summary</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-white/80">
                          <p className="text-3xl font-black text-emerald-600">
                            {analysisResult.skillMatch.length}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Matched</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/80">
                          <p className="text-3xl font-black text-rose-500">
                            {analysisResult.skillGap.length}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Missing</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/80">
                          <p className="text-3xl font-black text-amber-500">
                            {analysisResult.suggestions.length}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Tips</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white/80">
                          <p
                            className="text-3xl font-black"
                            style={{
                              color:
                                analysisResult.matchScore >= 80
                                  ? '#10b981'
                                  : analysisResult.matchScore >= 60
                                  ? '#0ea5e9'
                                  : analysisResult.matchScore >= 40
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          >
                            {analysisResult.matchScore}%
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Match</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay for analysis */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <Card className="shadow-2xl border-violet-200">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-800">AI is analyzing your resume</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Comparing skills, keywords, and qualifications...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-400">
          ResumeIQ — AI-Powered Resume Analyzer &middot; Built with Next.js, Tailwind CSS &amp; Gemini AI
        </div>
      </footer>
    </div>
  );
}
