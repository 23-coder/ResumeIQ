# ResumeIQ — AI-Powered Resume Analyzer

Upload your resume (PDF) and get an AI-powered analysis against any job description. Get match scores, skill gap analysis, keyword comparison, and actionable improvement suggestions.

![ResumeIQ Dashboard](https://img.shields.io/badge/Next.js-16-black?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square) ![Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange?style=flat-square)

## Features

- **PDF Resume Upload** — Drag & drop or click to upload, text is extracted automatically
- **AI-Powered Match Score** — 0-100 score with verdict (Excellent/Good/Fair/Poor)
- **Skill Match & Gap Analysis** — Green badges for matched skills, red for missing ones
- **Keyword Frequency Comparison** — See how often key terms appear in resume vs job description
- **Interactive Charts** — Bar chart, pie chart, and radar chart visualizations
- **Actionable Suggestions** — 4-6 specific tips to improve your resume for the target job
- **Resume Strengths** — What makes your resume strong for this position

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Charts** | Recharts (Bar, Pie, Radar) |
| **Animations** | Framer Motion |
| **Backend** | Next.js API Routes (App Router) |
| **Database** | SQLite via Prisma ORM |
| **AI** | Google Gemini 2.0 Flash API |
| **PDF Parsing** | pdf2json |

## How It Works

```
User uploads PDF resume → pdf2json extracts text → Stored in SQLite
User enters job description → Stored in SQLite
User clicks "Analyze" → Both sent to Gemini API with structured prompt
AI returns: match score, matched/missing skills, keyword analysis,
            strengths, and suggestions → Displayed in interactive dashboard
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/23-coder/ResumeIQ.git
cd ResumeIQ

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free Gemini API key at: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main 3-step wizard UI
│   └── api/
│       ├── resume/upload/        # POST - Upload PDF resume
│       ├── resume/list/          # GET  - List all resumes
│       ├── job-description/      # POST/GET - Job description CRUD
│       ├── analyze/              # POST - Run AI analysis
│       └── analysis/             # GET  - Fetch analysis results
├── lib/
│   ├── ai-analyzer.ts           # Gemini AI integration
│   ├── pdf-parser.ts            # PDF text extraction (pdf2json)
│   └── db.ts                    # Prisma client
├── components/ui/               # shadcn/ui components
prisma/
└── schema.prisma                # Database schema (Resume, JobDescription, Analysis)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resume/upload` | Upload PDF resume, extracts text |
| `GET` | `/api/resume/list` | List all uploaded resumes |
| `POST` | `/api/job-description` | Create a job description |
| `GET` | `/api/job-description` | List all job descriptions |
| `POST` | `/api/analyze` | Analyze resume against job description |
| `GET` | `/api/analysis` | Get analysis results |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Database for Production

For Vercel deployment, switch from SQLite to PostgreSQL:

1. Create a free [Supabase](https://supabase.com) project
2. Update `DATABASE_URL` in Vercel env vars
3. Update `prisma/schema.prisma` provider to `"postgresql"`

## License

This project is licensed under the MIT License.

## Author

**Aditya Chaturvedi** — [GitHub](https://github.com/23-coder)
