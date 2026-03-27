'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Briefcase, Users, BarChart3, 
  Settings, LogOut, Bell, ChevronDown, Search, Menu, X,
  TrendingUp, Plus, Sparkles
} from 'lucide-react'

const navItems = [
  { href: '/recruiter', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/recruiter/jobs', icon: Briefcase, label: 'Job Postings' },
  { href: '/recruiter/candidates', icon: Users, label: 'Candidates' },
  { href: '/recruiter/assessments', icon: BarChart3, label: 'Assessments' },
  { href: '/recruiter/analytics', icon: TrendingUp, label: 'Analytics' },
  { href: '/recruiter/settings', icon: Settings, label: 'Settings' },
]

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>

      {/* ─── SIDEBAR ─── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`} style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* Logo */}
        <div className="h-[68px] flex items-center px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/recruiter" className="flex items-center gap-2.5 group">
            <Image src="/hireai-logo.png" alt="HireAI" width={36} height={36} className="rounded-xl object-cover logo-glow group-hover:scale-105 transition-transform" />
            <div>
              <div className="text-white font-bold text-sm leading-tight">HireAI</div>
              <div className="text-surface-500 text-xs">Recruitment Platform</div>
            </div>
          </Link>
        </div>

        {/* Company Selector */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 border border-white/10">
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-300">TC</div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-white truncate">TechCorp India</div>
              <div className="text-xs text-surface-500">Pro Plan</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-surface-600 group-hover:text-surface-400 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-surface-600 px-3 mb-3">Main Menu</div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/recruiter' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active 
                    ? 'text-white' 
                    : 'text-surface-500 hover:text-surface-300 hover:bg-white/5'
                }`}
                style={active ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)' } : {}}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-400' : ''}`} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: AI Badge */}
        <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2.5 rounded-xl mb-2" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-bold text-brand-300">AI Assistant</span>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">Get instant insights on any candidate or role.</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)' }}>
              PS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Priya Sharma</div>
              <div className="text-xs text-surface-500">HR Manager</div>
            </div>
            <LogOut className="w-4 h-4 text-surface-600 group-hover:text-danger-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-[68px] flex items-center gap-4 px-6 sticky top-0 z-20 bg-white border-b border-surface-100">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-surface-500 hover:text-surface-800 transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                placeholder="Search candidates, roles..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-300 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-xl bg-surface-50 hover:bg-surface-100 flex items-center justify-center transition-colors border border-surface-100">
              <Bell className="w-4 h-4 text-surface-600" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
            </button>
            
            {/* Post Job */}
            <Link href="/recruiter/jobs/new"
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Plus className="w-4 h-4" />
              Post Job
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
