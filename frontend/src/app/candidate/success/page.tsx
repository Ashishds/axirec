'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, ArrowRight, Home, Briefcase, Mail } from 'lucide-react'

export default function InterviewSuccess() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center animate-slide-up-fade">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-8">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        {/* Title & Message */}
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Interview Completed!</h1>
        <p className="text-slate-500 leading-relaxed mb-10">
          Thank you for your time. Your AI-conducted interview has been successfully recorded. Our recruiting team will review the assessment and get back to you shortly via email.
        </p>
        
        {/* Help box */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100 flex items-start gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Mail className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Next Steps</div>
            <p className="text-xs text-slate-500 mt-1">Keep an eye on your inbox. You'll receive a confirmation email with a link to your candidate portal.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-200"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <Image src="/hireai-logo.png" alt="HireAI" width={32} height={32} className="rounded-lg opacity-40 grayscale" />
        <span className="text-slate-300 font-bold text-sm">Powered by HireAI</span>
      </div>
    </div>
  )
}
