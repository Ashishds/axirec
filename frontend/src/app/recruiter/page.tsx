'use client'

import Link from 'next/link'
import { 
  Briefcase, Users, CheckCircle, Clock, TrendingUp, 
  ArrowUpRight, ArrowRight, Video, Star, ChevronRight,
  Zap, BarChart3, Calendar
} from 'lucide-react'

const stats = [
  { label: 'Active Jobs', value: '12', change: '+3', trend: 'up', icon: Briefcase, color: 'brand' },
  { label: 'Applications', value: '248', change: '+18%', trend: 'up', icon: Users, color: 'purple' },
  { label: 'Interviews Today', value: '8', change: '3 live', trend: 'neutral', icon: Video, color: 'blue' },
  { label: 'Hired This Month', value: '7', change: '+40%', trend: 'up', icon: CheckCircle, color: 'green' },
]

const recentCandidates = [
  { name: 'Arjun Mehta', role: 'Senior React Developer', score: 91, status: 'shortlisted', time: '2h ago', avatar: 'AM' },
  { name: 'Deepika Rao', role: 'ML Engineer', score: 88, status: 'interviewed', time: '4h ago', avatar: 'DR' },
  { name: 'Karan Singh', role: 'Backend Engineer', score: 74, status: 'in-review', time: '1d ago', avatar: 'KS' },
  { name: 'Neha Patel', role: 'Product Manager', score: 95, status: 'offer', time: '1d ago', avatar: 'NP' },
  { name: 'Rohit Kumar', role: 'DevOps Engineer', score: 67, status: 'rejected', time: '2d ago', avatar: 'RK' },
]

const upcomingInterviews = [
  { candidate: 'Sonal Gupta', role: 'Data Scientist', time: '10:00 AM', type: 'Technical Round', initials: 'SG' },
  { candidate: 'Vikas Sharma', role: 'Full Stack Dev', time: '11:30 AM', type: 'HR Round', initials: 'VS' },
  { candidate: 'Priti Desai', role: 'UX Designer', time: '2:00 PM', type: 'Introduction', initials: 'PD' },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  shortlisted: { label: 'Shortlisted', className: 'bg-blue-50 text-blue-700' },
  interviewed: { label: 'Interviewed', className: 'bg-purple-50 text-purple-700' },
  'in-review': { label: 'In Review', className: 'bg-amber-50 text-amber-700' },
  offer: { label: 'Offer Sent', className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700' },
}

const colorMap: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-600',
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
}

export default function RecruiterDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-surface-900">Good morning, Priya 👋</h1>
          <p className="text-surface-700 font-medium mt-1">Here's what's happening with your hiring today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-surface-600 bg-white border border-surface-200 rounded-xl px-4 py-2">
            <Calendar className="w-4 h-4" />
            Wed, 18 Mar 2026
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                s.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-surface-100 text-surface-600'
              }`}>
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-bold font-display text-surface-900 mb-0.5">{s.value}</div>
            <div className="text-xs text-surface-700 font-semibold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="font-bold text-surface-900 font-display">Recent Applications</h2>
            <Link href="/recruiter/candidates" className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-50">
            {recentCandidates.map(c => (
              <div key={c.name} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-50 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-surface-900 text-sm">{c.name}</div>
                  <div className="text-xs text-surface-700 font-medium truncate">{c.role}</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold font-display ${c.score >= 85 ? 'text-green-600' : c.score >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                    {c.score}
                  </div>
                  <div className="text-[10px] text-surface-600 font-bold uppercase tracking-widest">score</div>
                </div>
                <span className={`badge ${statusConfig[c.status].className}`}>
                  {statusConfig[c.status].label}
                </span>
                <div className="text-xs text-surface-600 font-semibold hidden sm:block">{c.time}</div>
                <Link href={`/recruiter/candidates/${c.name}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <ArrowRight className="w-4 h-4 text-brand-500" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Interviews */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="font-bold text-surface-900 font-display">Today's Interviews</h2>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">3 scheduled</span>
          </div>
          <div className="p-4 space-y-3">
            {upcomingInterviews.map((iv, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {iv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-surface-900 text-sm">{iv.candidate}</div>
                  <div className="text-xs text-surface-600 font-medium mb-1.5 truncate">{iv.role}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white text-surface-800 px-2 py-0.5 rounded-lg border border-surface-200 font-bold">{iv.time}</span>
                    <span className="text-xs text-brand-600 font-bold">{iv.type}</span>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/recruiter/candidates"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold transition-colors mt-2">
              <Video className="w-4 h-4" />
              View All Interviews
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-brand-600 to-accent-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg font-display mb-1">AI Matching Engine Ready</h3>
            <p className="text-brand-200 text-sm">47 new applications received today. Run AI screening to shortlist candidates.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/recruiter/candidates"
              className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
              <Zap className="w-4 h-4" />
              Run AI Screening
            </Link>
            <Link href="/recruiter/jobs/new"
              className="flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
              + Post Job
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
