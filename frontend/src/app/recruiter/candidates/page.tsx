'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, ChevronDown, Eye, Video, Download, Star, TrendingUp, Users, Brain, FileText } from 'lucide-react'
import axios from 'axios'
import { getApiUrl } from '@/lib/api'

const candidates = [
  { id: '1', name: 'Arjun Mehta', email: 'arjun@email.com', role: 'Senior React Developer', score: 91, matchScore: 94, status: 'shortlisted', interviewed: true, avatar: 'AM', location: 'Bangalore', exp: '6 yrs', appliedAt: '2h ago' },
  { id: '2', name: 'Deepika Rao', email: 'deepika@email.com', role: 'ML Engineer', score: 88, matchScore: 87, status: 'interviewed', interviewed: true, avatar: 'DR', location: 'Hyderabad', exp: '4 yrs', appliedAt: '4h ago' },
  { id: '3', name: 'Karan Singh', email: 'karan@email.com', role: 'Senior React Developer', score: 74, matchScore: 79, status: 'in-review', interviewed: false, avatar: 'KS', location: 'Delhi', exp: '5 yrs', appliedAt: '1d ago' },
  { id: '4', name: 'Neha Patel', email: 'neha@email.com', role: 'Product Manager', score: 95, matchScore: 96, status: 'offer', interviewed: true, avatar: 'NP', location: 'Mumbai', exp: '7 yrs', appliedAt: '1d ago' },
  { id: '5', name: 'Rohit Kumar', email: 'rohit@email.com', role: 'DevOps Engineer', score: 67, matchScore: 71, status: 'rejected', interviewed: true, avatar: 'RK', location: 'Pune', exp: '3 yrs', appliedAt: '2d ago' },
  { id: '6', name: 'Priya Nair', email: 'priya@email.com', role: 'Senior React Developer', score: 82, matchScore: 85, status: 'scheduled', interviewed: false, avatar: 'PN', location: 'Chennai', exp: '4 yrs', appliedAt: '3d ago' },
  { id: '7', name: 'Amit Sharma', email: 'amit@email.com', role: 'Backend Engineer', score: 0, matchScore: 78, status: 'invited', interviewed: false, avatar: 'AS', location: 'Bangalore', exp: '5 yrs', appliedAt: '3d ago' },
  { id: '8', name: 'Sonam Gupta', email: 'sonam@email.com', role: 'UX Designer', score: 89, matchScore: 91, status: 'shortlisted', interviewed: true, avatar: 'SG', location: 'Mumbai', exp: '5 yrs', appliedAt: '4d ago' },
]

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  shortlisted:  { label: 'Shortlisted',  dot: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  interviewed:  { label: 'Interviewed',  dot: 'bg-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
  'in-review':  { label: 'In Review',    dot: 'bg-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
  offer:        { label: 'Offer Sent',   dot: 'bg-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
  rejected:     { label: 'Rejected',     dot: 'bg-red-400',    bg: 'bg-red-50',    text: 'text-red-700'    },
  scheduled:    { label: 'Scheduled',    dot: 'bg-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  invited:      { label: 'Invited',      dot: 'bg-sky-400',    bg: 'bg-sky-50',    text: 'text-sky-700'    },
}

const scoreColor = (s: number) => s >= 85 ? 'text-green-600' : s >= 70 ? 'text-amber-600' : s > 0 ? 'text-red-500' : 'text-surface-300'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function CandidatesContent() {
  const searchParams = useSearchParams()
  const jobIdParam = searchParams.get('job_id')
  const jobTitleParam = searchParams.get('job_title')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  
  const [activeTab, setActiveTab] = useState<'applications' | 'pool'>('applications')
  const [talentPool, setTalentPool] = useState<any[]>([])

  useEffect(() => {
    const fetchTalentPool = async () => {
      try {
        const token = localStorage.getItem('hireai_token')
        const API_URL = getApiUrl()
        const res = await axios.get(`${API_URL}/api/v1/profiles/talent-pool`, {
           headers: { Authorization: `Bearer ${token}` }
        })
        setTalentPool(res.data)
      } catch (err) {
        console.error('Failed to fetch talent pool', err)
      }
    }
    fetchTalentPool()
  }, [])

  // If we came from a specific job's "Manage" button, pre-fill the search with its title
  useEffect(() => {
    if (jobTitleParam) {
      setSearch(jobTitleParam)
    }
  }, [jobTitleParam])

  const filtered = candidates
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'match' ? b.matchScore - a.matchScore : 0)

  const statuses = ['all', ...Object.keys(statusConfig)]

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Match Score', 'Interview Score', 'Location', 'Experience', 'Applied']
    
    const csvContent = [
      headers.join(','),
      ...filtered.map(c => [
        `"${c.name}"`, 
        `"${c.email}"`, 
        `"${c.role}"`, 
        `"${statusConfig[c.status]?.label || c.status}"`, 
        `"${c.matchScore}%"`, 
        `"${c.score > 0 ? c.score : 'Pending'}"`,
        `"${c.location}"`,
        `"${c.exp}"`,
        `"${c.appliedAt}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'candidates_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-surface-900">All Candidates</h1>
          <p className="text-surface-700 font-medium mt-1">{filtered.length} candidates across all positions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 text-sm font-semibold text-surface-700 bg-white border border-surface-200 hover:bg-surface-50 px-4 py-2.5 rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applied', value: candidates.length, color: 'bg-surface-100 text-surface-700' },
          { label: 'Interviewed', value: candidates.filter(c => c.interviewed).length, color: 'bg-purple-100 text-purple-700' },
          { label: 'Shortlisted', value: candidates.filter(c => c.status === 'shortlisted').length, color: 'bg-blue-100 text-blue-700' },
          { label: 'Offers Sent', value: candidates.filter(c => c.status === 'offer').length, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} text-center`}>
            <div className="text-2xl font-bold font-display">{s.value}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-100 rounded-2xl p-1 mb-6 max-w-sm">
        <button onClick={() => setActiveTab('applications')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'applications' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
          Active Applications
        </button>
        <button onClick={() => setActiveTab('pool')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'pool' ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'} flex items-center justify-center gap-1.5`}>
          <Brain className="w-4 h-4" /> Talent Pool ({talentPool.length})
        </button>
      </div>

      {activeTab === 'applications' ? (
        <>
          {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, role, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm text-surface-900 font-medium placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-surface-700 font-bold uppercase tracking-wider whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-sm font-semibold text-surface-800 bg-surface-50 border border-surface-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="score">Interview Score</option>
              <option value="match">Match Score</option>
              <option value="date">Applied Date</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {statuses.slice(0, 7).map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}>
              {s === 'all' ? 'All Statuses' : statusConfig[s]?.label || s}
              {s === 'all' ? ` (${candidates.length})` : ` (${candidates.filter(c => c.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Candidate</th>
              <th className="text-left hidden md:table-cell">Position</th>
              <th className="text-center">Match</th>
              <th className="text-center">Score</th>
              <th className="text-left hidden sm:table-cell">Status</th>
              <th className="text-left hidden lg:table-cell">Applied</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const st = statusConfig[c.status] || { label: c.status, dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' }
              return (
                <tr key={c.id} className="group hover:bg-surface-50 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {c.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-surface-900 text-sm">{c.name}</div>
                        <div className="text-xs text-surface-600 font-medium">{c.location} · {c.exp}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="text-sm text-surface-700 font-medium">{c.role}</span>
                  </td>
                  <td className="text-center">
                    <span className={`text-sm font-bold ${scoreColor(c.matchScore)}`}>{c.matchScore}%</span>
                  </td>
                  <td className="text-center">
                    {c.score > 0 ? (
                      <span className={`text-sm font-bold ${scoreColor(c.score)}`}>{c.score}</span>
                    ) : (
                      <span className="text-xs text-surface-300 italic">Pending</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell text-xs text-surface-600 font-medium">{c.appliedAt}</td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      {c.interviewed && (
                        <Link href={`/recruiter/assessments`}
                          className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Report
                        </Link>
                      )}
                      {!c.interviewed && c.status === 'scheduled' && (
                        <Link href={`/candidate/room/${c.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Video className="w-3.5 h-3.5" /> Join
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-surface-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No candidates found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      </>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
          <div className="mb-6 flex items-center gap-3 bg-brand-50 border border-brand-100 p-4 rounded-xl">
            <Brain className="w-8 h-8 text-brand-600" />
            <div>
              <h3 className="font-bold text-brand-900 text-sm">Passive Talent Pool</h3>
              <p className="text-xs text-brand-700">These candidates have completed their profiles and uploaded resumes, but haven't applied to a specific job yet. The AI has already parsed their skills for you.</p>
            </div>
          </div>
          
          {talentPool.length === 0 ? (
            <div className="text-center py-16 text-surface-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No passive candidates found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {talentPool.map((tp, idx) => (
                <div key={idx} className="border border-surface-200 rounded-2xl p-5 hover:border-brand-300 transition-colors bg-surface-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700">
                        {tp.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900">{tp.full_name}</h4>
                        <p className="text-xs text-surface-500">{tp.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-2">Top Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tp.skills?.slice(0, 5).map((sk: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-surface-200 text-surface-600 font-medium text-[10px] rounded-md">
                          {sk}
                        </span>
                      ))}
                      {tp.skills?.length > 5 && (
                        <span className="px-2 py-1 bg-surface-100 text-surface-500 font-bold text-[10px] rounded-md">+{tp.skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-200">
                    <span className="text-xs font-bold text-surface-600">{tp.experience_years} Yrs Exp</span>
                    {tp.resume_url && (
                      <a href={tp.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                        <FileText className="w-3.5 h-3.5" /> View Resume
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /> Loading candidates...</div>}>
      <CandidatesContent />
    </Suspense>
  )
}
