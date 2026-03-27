'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/lib/api'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const role = searchParams.get('role') || 'recruiter'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Login failed')
      }

      const data = await response.json()
      
      // Store token and user info
      localStorage.setItem('hireai_token', data.access_token)
      localStorage.setItem('hireai_user', JSON.stringify(data.user))
      
      toast.success('Welcome back!')
      // Prioritize UI toggle role for redirection during testing
      router.push(role === 'recruiter' ? '/recruiter/jobs' : '/candidate/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT PANEL (dark brand side) ─── */}
      <div className="hidden lg:flex flex-col w-[520px] relative overflow-hidden p-14" style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        {/* Background glows */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(99,102,241,0.25) 0%, transparent 55%),
                           radial-gradient(circle at 80% 20%, rgba(217,70,239,0.15) 0%, transparent 55%)`,
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16 group">
            <Image src="/hireai-logo.png" alt="HireAI" width={44} height={44} className="rounded-xl object-cover logo-glow group-hover:scale-105 transition-transform" />
            <div>
              <div className="text-white font-bold text-xl tracking-tight">HireAI</div>
            </div>
          </Link>

          {/* Headline */}
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              The Intelligent Way<br />
              to <span className="gradient-text">Evaluate Talent</span>
            </h2>
            <p className="text-surface-400 text-base leading-relaxed">
              AI-powered interview platform that evaluates candidates comprehensively, consistently, and without bias.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-auto">
            {[
              { icon: Zap, text: 'Structured, multi-round interview framework' },
              { icon: Users, text: 'Conversational voice AI with natural dialogue' },
              { icon: Shield, text: 'Objective, standardised candidate evaluation' },
              { icon: ArrowRight, text: 'Comprehensive role-specific skill assessment' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <f.icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-surface-300 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <blockquote className="text-surface-300 text-sm leading-relaxed italic mb-4" style={{ borderLeft: '2px solid #6366f1', paddingLeft: '1rem' }}>
              &ldquo;HireAI transformed our talent pipeline. We hired a 50-person engineering team in half the time, with measurably better outcomes.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}>VK</div>
              <span className="text-surface-400 text-sm">Vikram Kapoor, VP Engineering, ScaleAI India</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (form) ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/hireai-logo.png" alt="HireAI" width={36} height={36} className="rounded-xl object-cover logo-glow" />
            <span className="text-xl font-bold text-surface-900 tracking-tight">HireAI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-surface-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.025em' }}>Welcome back</h1>
            <p className="text-surface-500 font-medium text-sm">
              New to HireAI?{' '}
              <Link href={`/auth/register?role=${role}`} className="text-brand-600 font-bold hover:text-brand-700 hover:underline">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-surface-100 rounded-2xl p-1 mb-8">
            {['recruiter', 'candidate'].map(r => (
              <Link key={r} href={`/auth/login?role=${r}`}
                className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-xl capitalize transition-all duration-200 ${
                  role === r 
                    ? 'bg-white text-surface-900 shadow-sm' 
                    : 'text-surface-500 hover:text-surface-700'
                }`}>
                {r}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-surface-800">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all text-sm font-medium pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-100" />
            <span className="text-xs text-surface-400 font-bold tracking-wider uppercase">or continue with</span>
            <div className="flex-1 h-px bg-surface-100" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { 
                id: 'google', 
                name: 'Google', 
                icon: (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.09H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.91l3.66-2.8z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.09l3.66 2.84c.87-2.6 3.3-4.55 6.16-4.55z" fill="#EA4335"/>
                  </svg>
                )
              },
              { 
                id: 'linkedin_oidc', 
                name: 'LinkedIn', 
                icon: (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#0077B5">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                  </svg>
                )
              },
            ].map(p => (
              <button 
                key={p.name}
                type="button"
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabaseClient')
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: p.id as any,
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?role=${role}`
                      }
                    })
                    if (error) throw error
                  } catch (err: any) {
                    toast.error(`Social login failed: ${err.message}`)
                  }
                }}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-sm font-semibold text-surface-700 transition-all hover:border-surface-300">
                <span>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-surface-400 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-brand-600 hover:underline font-medium">Terms</a> and{' '}
            <a href="#" className="text-brand-600 hover:underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
