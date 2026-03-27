'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Download, CheckCircle, XCircle,
  Brain, Clock, User, Mail, Phone, MapPin, TrendingUp,
  Play, Mic, FileText, BarChart3, ChevronDown, ChevronRight,
  AlertCircle
} from 'lucide-react'

// ── Candidate Data ────────────────────────────────────────────────────────────
const candidate = {
  name: 'Arjun Mehta',
  role: 'Senior React Developer',
  email: 'arjun.mehta@email.com',
  phone: '+91 98765 43210',
  location: 'Bangalore, Karnataka',
  linkedin: 'linkedin.com/in/arjunmehta',
  avatar: 'AM',
  interviewDate: 'Mar 17, 2026',
  interviewDuration: '42 mins',
  totalScore: 91,
  verdict: 'strong_hire',
  negotiatedSalary: '₹28 LPA',
  expectedSalary: '₹30 LPA',

  scores: {
    technical:     { score: 92, max: 100, label: 'Technical Skills' },
    behavioral:    { score: 88, max: 100, label: 'Behavioral' },
    communication: { score: 95, max: 100, label: 'Communication' },
    cultural:      { score: 90, max: 100, label: 'Cultural Fit' },
    problemSolving:{ score: 89, max: 100, label: 'Problem Solving' },
  },

  resume: {
    matchScore: 94,
    yearsExp: 6,
    skills:        ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'Redis'],
    missingSkills: ['Micro-Frontends', 'Terraform'],
    education:     'B.Tech Computer Science, IIT Delhi (2018)',
    experience: [
      { company: 'Flipkart', role: 'Senior Frontend Engineer', duration: '2022 – Present', years: '3 yrs' },
      { company: 'Razorpay',  role: 'Frontend Engineer',       duration: '2020 – 2022',    years: '2 yrs' },
      { company: 'Infosys',   role: 'Software Engineer (Trainee)', duration: '2018 – 2020', years: '2 yrs' },
    ],
    jdHighlights: [
      { req: '5+ years React',         matched: true  },
      { req: 'TypeScript proficiency',  matched: true  },
      { req: 'Node.js / Backend',       matched: true  },
      { req: 'AWS Cloud Services',      matched: true  },
      { req: 'Micro-frontend exp.',     matched: false },
      { req: 'Agile / Scrum',          matched: true  },
    ],
  },

  roundSummaries: [
    {
      round: 'Introduction Round',
      duration: '8 min',
      score: 90,
      highlights: [
        'Strong communication skills and confident demeanor',
        'Clear articulation of career progression and motivations',
        'Good understanding of company culture expectations',
      ],
    },
    {
      round: 'Technical Assessment',
      duration: '22 min',
      score: 92,
      highlights: [
        'Excellent knowledge of React internals, hooks, and concurrent features',
        'Demonstrated strong TypeScript and type safety practices',
        'Discussed real-time data sync architecture at scale convincingly',
        'Minor gap in micro-frontend architecture knowledge',
      ],
    },
    {
      round: 'Behavioural & HR',
      duration: '8 min',
      score: 88,
      highlights: [
        'Used STAR method effectively in scenario responses',
        'Showed ownership mindset and cross-team collaboration instincts',
        'Demonstrated good conflict resolution approach',
      ],
    },
    {
      round: 'Salary Negotiation',
      duration: '4 min',
      score: null,
      highlights: [
        'Candidate expected ₹30 LPA. AI negotiated to ₹28 LPA.',
        'Candidate accepted with joining bonus discussion.',
        'Notice period: 60 days, negotiated to 45 days.',
      ],
    },
  ],

  keyStrengths:       ['Deep React & TypeScript expertise', 'Excellent communication and presence', 'Strong system design thinking', 'Growth mindset and learnability'],
  areasOfImprovement: ['Micro-frontend architecture patterns', 'Cloud cost optimization practices'],

  transcript: [
    { speaker: 'AI',       time: '0:00',  text: 'Hello Arjun! Welcome to your interview for the Senior React Developer role at TechCorp India. I\'m your AI interviewer. Let\'s start with a quick introduction — could you walk me through your background?' },
    { speaker: 'Arjun',    time: '0:18',  text: 'Hi! Thanks for having me. I\'ve spent the last 6 years building frontend systems. Most recently at Flipkart, where I led the React migration of our seller dashboard — a platform serving 500K+ merchants.' },
    { speaker: 'AI',       time: '0:58',  text: 'Impressive! Could you tell me about a challenging technical problem you solved at Flipkart and the approach you took?' },
    { speaker: 'Arjun',    time: '1:12',  text: 'Sure. We had severe performance issues with our dashboard — initial load times were around 8 seconds. I introduced code-splitting with React.lazy, virtualised large lists with react-window, and moved heavy data processing to web workers. We brought load time down to under 2 seconds.' },
    { speaker: 'AI',       time: '2:05',  text: 'Excellent approach. How familiar are you with React\'s concurrent features like Suspense and the Transition API?' },
    { speaker: 'Arjun',    time: '2:20',  text: 'Very familiar. We adopted React 18 early. I used startTransition to keep the search input responsive while filtering large datasets, and Suspense boundaries for streaming server-side data fetches. It significantly improved perceived performance.' },
    { speaker: 'AI',       time: '3:10',  text: 'Great. Let\'s move to a system design question. How would you architect a real-time collaborative document editor in React?' },
    { speaker: 'Arjun',    time: '3:25',  text: 'I\'d use WebSockets for real-time sync with an Operational Transformation or CRDT approach to handle conflict resolution. On the frontend, I\'d use a controlled editor like ProseMirror, manage state in Zustand, and debounce local updates before broadcasting. Redis Pub/Sub on the backend for broadcasting to connected clients.' },
    { speaker: 'AI',       time: '4:45',  text: 'Well thought out. Now for HR — tell me about a time you had a conflict with a team member. How did you handle it?' },
    { speaker: 'Arjun',    time: '5:00',  text: 'At Razorpay, our tech lead and I disagreed on the state management strategy — they preferred Redux, I felt Zustand was more appropriate for our scale. I documented both approaches with benchmarks and trade-offs and presented it. We aligned on Zustand, and it reduced our bundle size by 12%. The key was keeping it objective.' },
    { speaker: 'AI',       time: '6:10',  text: 'Perfect. Final section — regarding compensation, we are targeting ₹26–28 LPA for this role. What are your expectations?' },
    { speaker: 'Arjun',    time: '6:22',  text: 'I was expecting ₹30 LPA based on my current package and market research. However, I\'m also considering growth opportunities and the impact of the role.' },
    { speaker: 'AI',       time: '6:40',  text: 'Understood. We can offer ₹28 LPA with a performance review at 6 months and a joining bonus of ₹1 LPA. Does that work?' },
    { speaker: 'Arjun',    time: '6:55',  text: 'Yes, that sounds fair. I can also aim for a 45-day notice period instead of 60 days if possible.' },
    { speaker: 'AI',       time: '7:10',  text: 'Noted. We\'ll factor that in. Thank you so much, Arjun — it was a great conversation. We\'ll share the detailed report with TechCorp\'s HR team.' },
  ],
}

// ── Verdict Config ────────────────────────────────────────────────────────────
const verdictConfig = {
  strong_hire: { label: 'Strong Hire ✓', className: 'bg-green-50 text-green-700 border-green-200' },
  hire:        { label: 'Hire',          className: 'bg-blue-50 text-blue-700 border-blue-200'   },
  no_hire:     { label: 'No Hire',       className: 'bg-red-50 text-red-700 border-red-200'       },
}

// ── Score Ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, strokeWidth = 7, color = '#6366f1' }: {
  score: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CandidateAssessmentPage() {
  const [activeTab, setActiveTab]   = useState('overview')
  const [playingTime, setPlayingTime] = useState<string | null>(null)

  // ── Export Report as text file ──
  const exportReport = () => {
    const lines = [
      `HireAI — Candidate Assessment Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `${'='.repeat(50)}`,
      `Candidate     : ${candidate.name}`,
      `Role          : ${candidate.role}`,
      `Email         : ${candidate.email}`,
      `Phone         : ${candidate.phone}`,
      `Location      : ${candidate.location}`,
      `Interview Date: ${candidate.interviewDate}`,
      `Duration      : ${candidate.interviewDuration}`,
      ``,
      `OVERALL SCORE : ${candidate.totalScore}/100`,
      `VERDICT       : ${verdictConfig[candidate.verdict as keyof typeof verdictConfig].label}`,
      `AGREED CTC    : ${candidate.negotiatedSalary}`,
      ``,
      `${'─'.repeat(50)}`,
      `SCORE BREAKDOWN`,
      `${'─'.repeat(50)}`,
      ...Object.values(candidate.scores).map(s => `  ${s.label.padEnd(22)}: ${s.score}/100`),
      ``,
      `${'─'.repeat(50)}`,
      `ROUND SUMMARIES`,
      `${'─'.repeat(50)}`,
      ...candidate.roundSummaries.flatMap(r => [
        `  [${r.round}] — ${r.duration}${r.score ? `  Score: ${r.score}/100` : ''}`,
        ...r.highlights.map(h => `    • ${h}`),
        ``,
      ]),
      `${'─'.repeat(50)}`,
      `KEY STRENGTHS`,
      `${'─'.repeat(50)}`,
      ...candidate.keyStrengths.map(s => `  + ${s}`),
      ``,
      `${'─'.repeat(50)}`,
      `AREAS TO DEVELOP`,
      `${'─'.repeat(50)}`,
      ...candidate.areasOfImprovement.map(s => `  ~ ${s}`),
      ``,
      `${'─'.repeat(50)}`,
      `JD MATCH       : ${candidate.resume.matchScore}%`,
      `Matched Skills : ${candidate.resume.skills.join(', ')}`,
      `Missing Skills : ${candidate.resume.missingSkills.join(', ')}`,
      `Education      : ${candidate.resume.education}`,
      ``,
      `${'─'.repeat(50)}`,
      `SALARY NEGOTIATION`,
      `Expected CTC   : ${candidate.expectedSalary}`,
      `Agreed CTC     : ${candidate.negotiatedSalary}`,
      `Notice Period  : 45 days`,
      ``,
      `${'='.repeat(50)}`,
      `Report generated by HireAI — AI Interview & Skill Assessment Platform`,
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `${candidate.name.replace(' ', '_')}_Assessment_Report.txt`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const verdict = verdictConfig[candidate.verdict as keyof typeof verdictConfig]

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Back */}
      <Link href="/recruiter/candidates" className="flex items-center gap-2 text-sm font-bold text-surface-700 hover:text-surface-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Candidates
      </Link>

      {/* ── Hero Header ── */}
      <div className="bg-white rounded-3xl border border-surface-100 shadow-card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {candidate.avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-surface-900">{candidate.name}</h1>
              <p className="text-surface-700 font-semibold">{candidate.role}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs font-medium text-surface-600"><Mail className="w-3.5 h-3.5 text-surface-500" />{candidate.email}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-surface-600"><Phone className="w-3.5 h-3.5 text-surface-500" />{candidate.phone}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-surface-600"><MapPin className="w-3.5 h-3.5 text-surface-500" />{candidate.location}</span>
              </div>
            </div>
          </div>

          <div className="lg:ml-auto flex flex-wrap items-center gap-4">
            <div className="relative flex items-center justify-center">
              <ScoreRing score={candidate.totalScore} size={88} color="#6366f1" />
              <div className="absolute text-center">
                <div className="text-xl font-bold font-display text-surface-900">{candidate.totalScore}</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-surface-600 uppercase tracking-widest mb-1.5">Overall Score</div>
              <span className={`inline-flex border text-sm font-bold px-3 py-1 rounded-full ${verdict.className}`}>{verdict.label}</span>
              <div className="text-xs text-surface-600 font-medium mt-1.5">
                <span className="text-green-600 font-bold">{candidate.negotiatedSalary}</span> agreed CTC
              </div>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                onClick={exportReport}
                className="flex items-center gap-2 border border-surface-200 text-surface-800 hover:bg-surface-50 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Export Report
              </button>
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
                <CheckCircle className="w-4 h-4" /> Send Offer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview',    label: '📊 Overview'      },
          { id: 'transcript',  label: '📝 Transcript'    },
          { id: 'recording',   label: '🎬 Recording'     },
          { id: 'resume',      label: '📄 Resume Match'  },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Score Breakdown */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold text-surface-900 font-display mb-5">Score Breakdown</h2>
              <div className="space-y-4">
                {Object.values(candidate.scores).map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-surface-800">{s.label}</span>
                      <span className={`text-sm font-bold ${s.score >= 90 ? 'text-green-600' : s.score >= 75 ? 'text-brand-600' : 'text-amber-600'}`}>{s.score}/100</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.score >= 90 ? 'bg-green-500' : s.score >= 75 ? 'bg-brand-500' : 'bg-amber-500'}`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Round Summaries */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold text-surface-900 font-display mb-5">Round-by-Round Analysis</h2>
              <div className="space-y-4">
                {candidate.roundSummaries.map((round, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">{i + 1}</div>
                        <span className="font-semibold text-surface-900 text-sm">{round.round}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-600 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{round.duration}</span>
                        {round.score && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${round.score >= 90 ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-700'}`}>{round.score}/100</span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {round.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-surface-800 font-medium">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold text-surface-900 font-display mb-4">Key Strengths</h2>
              <ul className="space-y-2">
                {candidate.keyStrengths.map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-surface-800">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-3 h-3 text-green-600" /></div>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold text-surface-900 font-display mb-4">Areas to Develop</h2>
              <ul className="space-y-2">
                {candidate.areasOfImprovement.map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-surface-800">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-3 h-3 text-amber-600" /></div>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl border border-brand-100 p-5">
              <h2 className="font-bold text-surface-900 font-display mb-3">💰 Salary Negotiation</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-surface-700 font-medium">Expected CTC</span><span className="font-bold text-surface-800 line-through">{candidate.expectedSalary}</span></div>
                <div className="flex justify-between"><span className="text-surface-700 font-medium">Negotiated CTC</span><span className="font-bold text-green-600">{candidate.negotiatedSalary}</span></div>
                <div className="flex justify-between"><span className="text-surface-700 font-medium">Notice Period</span><span className="font-bold text-surface-900">45 days</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TRANSCRIPT ══════════════ */}
      {activeTab === 'transcript' && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50">
            <div>
              <h2 className="font-bold font-display text-surface-900">Interview Transcript</h2>
              <p className="text-xs text-surface-500 font-medium mt-0.5">AI-generated transcript · {candidate.interviewDuration} · {candidate.interviewDate}</p>
            </div>
            <button onClick={exportReport} className="flex items-center gap-2 text-sm font-semibold text-surface-700 bg-white border border-surface-200 hover:bg-surface-50 px-4 py-2 rounded-xl transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Round markers */}
          <div className="flex gap-2 px-6 py-3 border-b border-surface-100 overflow-x-auto">
            {['Introduction (0:00)', 'Technical (8:00)', 'HR (30:00)', 'Salary (38:00)'].map(m => (
              <span key={m} className="text-[11px] font-bold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full whitespace-nowrap">{m}</span>
            ))}
          </div>

          <div className="divide-y divide-surface-50 max-h-[600px] overflow-y-auto">
            {candidate.transcript.map((line, i) => (
              <div key={i} className={`flex gap-4 px-6 py-4 hover:bg-surface-50 transition-colors ${line.speaker === 'AI' ? '' : 'bg-brand-50/30'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  line.speaker === 'AI' ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white' : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                }`}>
                  {line.speaker === 'AI' ? 'AI' : candidate.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-surface-900">{line.speaker === 'AI' ? 'HireAI Interviewer' : candidate.name}</span>
                    <span className="text-[11px] font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">{line.time}</span>
                  </div>
                  <p className="text-sm text-surface-700 font-medium leading-relaxed">{line.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ RECORDING ══════════════ */}
      {activeTab === 'recording' && (
        <div className="space-y-6">
          {/* Main Player */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100">
              <h2 className="font-bold font-display text-surface-900">Interview Recording</h2>
              <p className="text-xs text-surface-500 font-medium mt-0.5">{candidate.interviewDate} · {candidate.interviewDuration}</p>
            </div>

            {/* Video placeholder */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 aspect-video max-h-80 flex flex-col items-center justify-center gap-4 relative">
              <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="text-white/70 text-sm font-medium">Recording available after production deployment</p>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full w-0" />
                </div>
                <div className="flex justify-between text-xs text-white/50 font-medium mt-1">
                  <span>0:00</span><span>{candidate.interviewDuration}</span>
                </div>
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex items-center gap-4 px-6 py-3 border-t border-surface-100 bg-surface-50">
              <button className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center hover:bg-brand-700 transition-colors">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-surface-500">
                <Mic className="w-3.5 h-3.5" /> Audio Only
              </div>
              <div className="ml-auto flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-surface-600 bg-white border border-surface-200 px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>

          {/* Round clips */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
            <h3 className="font-bold font-display text-surface-900 mb-4">Round Clips</h3>
            <div className="space-y-3">
              {candidate.roundSummaries.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors cursor-pointer border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-brand-600 ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-surface-900">{r.round}</div>
                    <div className="text-xs text-surface-500 font-medium">{r.duration}</div>
                  </div>
                  {r.score && (
                    <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{r.score}/100</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="font-medium">Video recordings are stored securely in AWS S3 and will be available once the backend storage integration is connected. The transcript and AI report are available now.</span>
          </div>
        </div>
      )}

      {/* ══════════════ RESUME MATCH ══════════════ */}
      {activeTab === 'resume' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Match Score & JD Checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* JD Match */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold font-display text-surface-900 mb-6">JD Requirements Match</h2>
              <div className="space-y-3">
                {candidate.resume.jdHighlights.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {item.matched
                      ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      : <XCircle    className="w-5 h-5 text-red-500   flex-shrink-0" />}
                    <span className={`text-sm font-semibold ${item.matched ? 'text-green-800' : 'text-red-700'}`}>{item.req}</span>
                    <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${item.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {item.matched ? '✓ Matched' : '✗ Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Timeline */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold font-display text-surface-900 mb-5">Work Experience</h2>
              <div className="relative pl-5 border-l-2 border-brand-200 space-y-6">
                {candidate.resume.experience.map((exp, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow" />
                    <div className="ml-2">
                      <div className="text-sm font-bold text-surface-900">{exp.role}</div>
                      <div className="text-sm font-semibold text-brand-600">{exp.company}</div>
                      <div className="text-xs text-surface-500 font-medium mt-1">{exp.duration} · {exp.years}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Match Score Donut */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6 text-center">
              <h2 className="font-bold font-display text-surface-900 mb-4">Overall JD Match</h2>
              <div className="relative inline-flex items-center justify-center mb-4">
                <ScoreRing score={candidate.resume.matchScore} size={100} strokeWidth={9} color="#22c55e" />
                <div className="absolute">
                  <div className="text-2xl font-bold font-display text-green-600">{candidate.resume.matchScore}%</div>
                </div>
              </div>
              <p className="text-xs text-surface-500 font-medium">Strong match against Senior React Developer JD</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
              <h2 className="font-bold font-display text-surface-900 mb-4">Matched Skills</h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {candidate.resume.skills.map(s => (
                  <span key={s} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-semibold border border-green-200">{s}</span>
                ))}
              </div>
              <h3 className="text-sm font-bold text-surface-700 mb-2">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.resume.missingSkills.map(s => (
                  <span key={s} className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-semibold border border-red-200">{s}</span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-5">
              <h2 className="font-bold font-display text-surface-900 mb-3">Education</h2>
              <div className="text-sm font-semibold text-surface-800">{candidate.resume.education}</div>
              <div className="text-xs text-surface-500 font-medium mt-1">{candidate.resume.yearsExp} years total experience</div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
