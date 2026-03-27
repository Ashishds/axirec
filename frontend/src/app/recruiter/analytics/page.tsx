'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, Briefcase, Clock, CheckCircle, 
  XCircle, ArrowUpRight, BarChart2, Filter, Download, ChevronDown,
  Zap, Star, Target, Video, MessageSquare, Brain, Award, Calendar
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Total Applications',  value: '1,284', change: '+18%', positive: true,  icon: Users,       color: 'brand',  sub: 'vs last 30 days' },
  { label: 'AI Interviews Done',  value: '347',   change: '+24%', positive: true,  icon: Video,       color: 'purple', sub: 'this month' },
  { label: 'Avg. Time to Hire',   value: '14.2d', change: '-3d',  positive: true,  icon: Clock,       color: 'amber',  sub: 'days' },
  { label: 'Offer Acceptance',    value: '87%',   change: '+5%',  positive: true,  icon: CheckCircle, color: 'green',  sub: 'rate' },
  { label: 'AI Match Accuracy',   value: '94.1%', change: '+1.2%',positive: true,  icon: Brain,       color: 'accent', sub: 'precision' },
  { label: 'Rejected Candidates', value: '203',   change: '+8',   positive: false, icon: XCircle,     color: 'red',    sub: 'this period' },
]

const pipeline = [
  { stage: 'Applied',     count: 1284, pct: 100, color: 'bg-brand-500' },
  { stage: 'AI Screened', count: 916,  pct: 71,  color: 'bg-purple-500' },
  { stage: 'Shortlisted', count: 412,  pct: 32,  color: 'bg-blue-500' },
  { stage: 'Interviewed', count: 347,  pct: 27,  color: 'bg-amber-500' },
  { stage: 'Offer Sent',  count: 89,   pct: 7,   color: 'bg-green-500' },
  { stage: 'Hired',       count: 61,   pct: 5,   color: 'bg-emerald-600' },
]

const topJobs = [
  { title: 'Senior React Developer',  dept: 'Engineering',  apps: 97,  filled: false, score: 88, urgency: 'high'   },
  { title: 'ML Engineer — NLP',        dept: 'AI/ML',        apps: 73,  filled: false, score: 92, urgency: 'medium' },
  { title: 'Product Manager',          dept: 'Product',      apps: 114, filled: false, score: 76, urgency: 'low'    },
  { title: 'Full Stack Developer',     dept: 'Engineering',  apps: 89,  filled: true,  score: 91, urgency: 'low'    },
  { title: 'Data Scientist',           dept: 'Analytics',    apps: 55,  filled: false, score: 85, urgency: 'high'   },
]

const sources = [
  { name: 'LinkedIn',     pct: 42, count: 539, color: 'bg-blue-500' },
  { name: 'Referrals',    pct: 22, count: 282, color: 'bg-green-500' },
  { name: 'Careers Page', pct: 19, count: 244, color: 'bg-brand-500' },
  { name: 'Indeed',       pct: 11, count: 141, color: 'bg-orange-500' },
  { name: 'Other',        pct: 6,  count: 78,  color: 'bg-surface-400' },
]

const topCandidates = [
  { name: 'Neha Patel',      role: 'Product Manager',       score: 96, status: 'Offer Sent',   avatar: 'NP' },
  { name: 'Arjun Mehta',     role: 'React Developer',       score: 93, status: 'Shortlisted',  avatar: 'AM' },
  { name: 'Deepika Rao',     role: 'Data Scientist',        score: 91, status: 'Interviewed',  avatar: 'DR' },
  { name: 'Sonal Gupta',     role: 'ML Engineer',           score: 90, status: 'Shortlisted',  avatar: 'SG' },
  { name: 'Vikas Sharma',    role: 'Full Stack Developer',  score: 89, status: 'Interviewed',  avatar: 'VS' },
]

const weeklyTrend = [
  { day: 'Mon', apps: 34, interviews: 12 },
  { day: 'Tue', apps: 48, interviews: 18 },
  { day: 'Wed', apps: 41, interviews: 15 },
  { day: 'Thu', apps: 62, interviews: 24 },
  { day: 'Fri', apps: 55, interviews: 20 },
  { day: 'Sat', apps: 22, interviews: 8  },
  { day: 'Sun', apps: 18, interviews: 5  },
]
const maxApps = Math.max(...weeklyTrend.map(d => d.apps))

// ── Color helpers ─────────────────────────────────────────────────────────────
const colorBg: Record<string, string> = {
  brand:  'bg-brand-100',
  purple: 'bg-purple-100',
  amber:  'bg-amber-100',
  green:  'bg-green-100',
  accent: 'bg-accent-100',
  red:    'bg-red-100',
}
const colorText: Record<string, string> = {
  brand:  'text-brand-600',
  purple: 'text-purple-600',
  amber:  'text-amber-600',
  green:  'text-green-600',
  accent: 'text-accent-600',
  red:    'text-red-500',
}

const statusBadge: Record<string, string> = {
  'Offer Sent':   'bg-green-50 text-green-700',
  'Shortlisted':  'bg-blue-50 text-blue-700',
  'Interviewed':  'bg-purple-50 text-purple-700',
}

const urgencyDot: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-green-500',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-surface-900">Recruitment Analytics</h1>
          <p className="text-surface-600 font-medium mt-1">Real-time hiring insights powered by HireAI</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range Selector */}
          <div className="flex bg-surface-100 rounded-xl p-1 text-sm font-semibold">
            {['7d','30d','90d'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  range === r
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >{r}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover transition-all p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorBg[k.color]} mb-4`}>
              <k.icon className={`w-5 h-5 ${colorText[k.color]}`} />
            </div>
            <div className="text-2xl font-bold font-display text-surface-900 leading-none mb-1">{k.value}</div>
            <div className="text-[11px] text-surface-500 font-bold uppercase tracking-wider mb-3">{k.label}</div>
            <div className={`flex items-center gap-1 text-xs font-bold ${k.positive ? 'text-green-600' : 'text-red-500'}`}>
              {k.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {k.change} <span className="text-surface-400 font-normal">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold font-display text-surface-900 text-lg">Hiring Pipeline</h2>
              <p className="text-sm text-surface-500 font-medium mt-0.5">Overall conversion funnel</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" /> 4.7% hire rate
            </span>
          </div>
          <div className="space-y-3">
            {pipeline.map((p) => (
              <div key={p.stage} className="flex items-center gap-4">
                <div className="w-28 text-sm font-semibold text-surface-700 flex-shrink-0">{p.stage}</div>
                <div className="flex-1 h-8 bg-surface-50 rounded-xl overflow-hidden relative">
                  <div
                    className={`h-full ${p.color} rounded-xl transition-all duration-700 flex items-center justify-end pr-3`}
                    style={{ width: `${p.pct}%` }}
                  >
                    {p.pct > 15 && <span className="text-xs font-bold text-white">{p.pct}%</span>}
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-bold text-surface-900 flex-shrink-0">{p.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
          <h2 className="font-bold font-display text-surface-900 text-lg mb-1">Sourcing Channels</h2>
          <p className="text-sm text-surface-500 font-medium mb-6">Where candidates come from</p>
          <div className="space-y-5">
            {sources.map(s => (
              <div key={s.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-surface-800">{s.name}</span>
                  <span className="text-sm font-bold text-surface-900">{s.count.toLocaleString()}</span>
                </div>
                <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="text-right text-[11px] font-bold text-surface-400 mt-1">{s.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Weekly Trend — Bar chart (pure CSS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold font-display text-surface-900 text-lg">Weekly Activity</h2>
              <p className="text-sm text-surface-500 font-medium mt-0.5">Applications vs. AI Interviews</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" />Applications</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent-400 inline-block" />Interviews</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {weeklyTrend.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full">
                  <div
                    className="flex-1 bg-brand-500 rounded-t-lg transition-all"
                    style={{ height: `${(d.apps / maxApps) * 130}px` }}
                    title={`${d.apps} applications`}
                  />
                  <div
                    className="flex-1 bg-accent-400 rounded-t-lg transition-all"
                    style={{ height: `${(d.interviews / maxApps) * 130}px` }}
                    title={`${d.interviews} interviews`}
                  />
                </div>
                <span className="text-[11px] font-bold text-surface-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Candidates */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="font-bold font-display text-surface-900">Top AI Scores</h2>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="divide-y divide-surface-50">
            {topCandidates.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-50 transition-colors">
                <span className="text-[11px] font-bold text-surface-400 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-surface-900 truncate">{c.name}</div>
                  <div className="text-xs text-surface-500 font-medium truncate">{c.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-display text-green-600">{c.score}</div>
                  <div className="text-[10px] text-surface-400 font-bold uppercase">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Job Performance Table ── */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div>
            <h2 className="font-bold font-display text-surface-900 text-lg">Job Performance</h2>
            <p className="text-sm text-surface-500 font-medium">Applications and AI match scores per posting</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-surface-900 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-50">
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Job Title</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Dept</th>
                <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Applications</th>
                <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Avg AI Score</th>
                <th className="text-center px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Urgency</th>
                <th className="text-center px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-surface-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {topJobs.map((j, i) => (
                <tr key={i} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-surface-900">{j.title}</td>
                  <td className="px-6 py-4 text-sm text-surface-600 font-medium">{j.dept}</td>
                  <td className="px-6 py-4 text-sm font-bold text-surface-900 text-right">{j.apps}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${j.score >= 90 ? 'text-green-600' : j.score >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                      {j.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-xs font-bold capitalize">
                      <span className={`w-2 h-2 rounded-full ${urgencyDot[j.urgency]}`} />
                      {j.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${j.filled ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {j.filled ? 'Filled' : 'Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
