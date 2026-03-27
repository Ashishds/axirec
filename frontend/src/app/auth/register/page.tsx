'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/lib/api'

const benefits = {
  recruiter: [
    'Post and manage unlimited job listings',
    'Automated resume screening and candidate shortlisting',
    'Conduct structured AI video interviews at scale',
    'Receive comprehensive candidate evaluation reports',
    'Reduce screening time by over 80% per role',
  ],
  candidate: [
    'Complete your application in under two minutes',
    'Fair, objective AI-powered evaluation — zero bias',
    'Interview on your schedule, from anywhere',
    'Receive structured feedback after every interview',
    'Manage all your applications in a single dashboard',
  ],
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(searchParams.get('role') || 'recruiter')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', company: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.')
    setLoading(true)
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: role, // 'recruiter' or 'candidate'
          company_name: role === 'recruiter' ? form.company : undefined
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Registration failed')
      }

      const data = await response.json()
      
      // Store token and user info
      localStorage.setItem('hireai_token', data.access_token)
      localStorage.setItem('hireai_user', JSON.stringify(data.user))
      
      toast.success('Account created. Welcome to HireAI.')
      router.push(role === 'recruiter' ? '/recruiter/jobs' : '/candidate/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex flex-col w-[520px] relative overflow-hidden p-14" style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 70% 30%, rgba(99,102,241,0.2) 0%, transparent 60%),
                           radial-gradient(circle at 20% 80%, rgba(217,70,239,0.15) 0%, transparent 60%)`,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16 group">
            <Image src="/hireai-logo.png" alt="HireAI" width={44} height={44} className="rounded-xl object-cover logo-glow group-hover:scale-105 transition-transform" />
            <div className="text-white font-bold text-xl tracking-tight">HireAI</div>
          </Link>

          {/* Headline */}
          <div className="mb-10">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              {role === 'recruiter' ? 'Hire With Confidence' : 'Find Your Next Opportunity'}
            </h2>
            <p className="text-surface-400 text-base leading-relaxed">
              {role === 'recruiter'
                ? 'Automate your entire recruitment workflow — from initial screening to structured final assessments.'
                : 'Experience a transparent, bias-free AI interview process from the comfort of your home.'}
            </p>
          </div>

          {/* Benefits list */}
          <ul className="space-y-3 mb-auto">
            {benefits[role as 'recruiter' | 'candidate'].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <CheckCircle className="w-3 h-3 text-brand-400" />
                </div>
                <span className="text-surface-300 text-sm font-medium leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="mt-12 pt-8 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex -space-x-2.5">
              {['PS', 'RM', 'AG'].map((i, idx) => (
                <div key={idx} className="w-9 h-9 rounded-full border-2 border-surface-800 flex items-center justify-center text-xs font-bold text-white shadow-md"
                  style={{ background: `hsl(${idx * 80 + 200}, 60%, 50%)` }}>{i}</div>
              ))}
            </div>
            <div className="text-surface-400 text-xs font-medium">
              Trusted by <strong className="text-white">2,000+</strong> companies and <strong className="text-white">50,000+</strong> professionals worldwide
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/hireai-logo.png" alt="HireAI" width={36} height={36} className="rounded-xl object-cover logo-glow" />
            <span className="text-xl font-bold text-surface-900 tracking-tight">HireAI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-surface-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.025em' }}>Create your account</h1>
            <p className="text-surface-500 text-sm font-medium">
              Already have an account?{' '}
              <Link href={`/auth/login?role=${role}`} className="text-brand-600 font-bold hover:text-brand-700 hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-surface-100 rounded-2xl p-1 mb-7">
            {['recruiter', 'candidate'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-xl capitalize transition-all duration-200 ${
                  role === r ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                }`}>
                {r === 'recruiter' ? 'I am Hiring' : 'I am a Candidate'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-2">Full Name *</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required
                placeholder="Priya Sharma"
                className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 text-sm font-medium transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-2">Work Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                placeholder="priya@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 text-sm font-medium transition-all" />
            </div>
            {role === 'recruiter' && (
              <div>
                <label className="block text-sm font-semibold text-surface-800 mb-2">Company Name</label>
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  placeholder="TechCorp India"
                  className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 text-sm font-medium transition-all" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-2">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 text-sm font-medium transition-all pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-surface-400 pt-1">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-brand-600 font-semibold hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-brand-600 font-semibold hover:underline">Privacy Policy</a>.
            </p>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
