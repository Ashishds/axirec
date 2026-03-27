'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import Image from 'next/image'
import {
  Video, VideoOff, Mic, MicOff, Settings,
  MessageSquare, Users, Shield, Send, Sparkles,
  Loader2, CheckCircle, AlertCircle, Play, Pause,
  Volume2, VolumeX, Mic as LucideMic, Brain, Calendar, Clock, ArrowRight, Wifi, MapPin,
  ChevronRight, PhoneOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProctoring } from '@/hooks/useProctoring'
import { getApiUrl } from '@/lib/api'

type InterviewRound = 'intro' | 'technical' | 'behavioral' | 'salary'

const rounds: { id: InterviewRound; label: string; color: string; icon: string }[] = [
  { id: 'intro', label: 'Introduction', color: '#6366f1', icon: '👋' },
  { id: 'technical', label: 'Technical', color: '#a855f7', icon: '💻' },
  { id: 'behavioral', label: 'Behavioural', color: '#f59e0b', icon: '🧠' },
  { id: 'salary', label: 'Salary', color: '#22c55e', icon: '💰' },
]

function VoiceBars({ active, color = '#818cf8', size = 'md' }: { active: boolean; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const heights = size === 'lg' ? [12, 20, 28, 20, 12] : size === 'sm' ? [6, 10, 14, 10, 6] : [8, 14, 20, 14, 8]
  return (
    <div className={`flex items-end gap-[3px] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-20'}`}>
      {heights.map((h, i) => (
        <div key={i}
          className={`w-[3px] rounded-full ${active ? 'voice-bar' : ''}`}
          style={{
            height: active ? `${h}px` : '3px',
            animationDelay: `${i * 0.12}s`,
            background: color,
            transition: 'height 0.3s ease',
          }} />
      ))}
    </div>
  )
}

function ScoreRing({ score, label, color, size = 72 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90 absolute inset-0" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-white">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{label}</span>
    </div>
  )
}

function PulseRing({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  return (
    <>
      <div className="absolute -inset-3 rounded-full animate-ping opacity-20" style={{ background: color, animationDuration: '1.5s' }} />
      <div className="absolute -inset-6 rounded-full animate-ping opacity-10" style={{ background: color, animationDuration: '1.5s', animationDelay: '0.3s' }} />
    </>
  )
}

export default function InterviewRoom({ params }: { params: { interviewId: string } }) {
  const [hasStarted, setHasStarted] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [currentRound, setCurrentRound] = useState<InterviewRound>('intro')
  const [elapsed, setElapsed] = useState(0)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [candidateSpeaking, setCandidateSpeaking] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [scores, setScores] = useState({ technical: 0, communication: 0, confidence: 0 })
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [activePanel, setActivePanel] = useState<'transcript' | 'insights' | null>('transcript')
  const [showRoundTransition, setShowRoundTransition] = useState(false)
  
  const aiSpeakingRef = useRef(false)
  const prevRoundRef = useRef<InterviewRound>('intro')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const proctorStatus = useProctoring(videoRef, hasStarted && camOn)
  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioQueue = useRef<string[]>([])
  const isPlaying = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const speakerOnRef = useRef(true)
  const micOnRef = useRef(true)

  const initSocket = async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return socketRef.current;
    
    const apiUrl = getApiUrl()
    const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:'
    const host = apiUrl.replace(/^https?:\/\//, '')
    const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : 'mock'
    
    console.log(`Initializing WebSocket: ${protocol}//${host}/ws/v1/interview/${params.interviewId || 'test'}`)
    const socket = new WebSocket(`${protocol}//${host}/ws/v1/interview/${params.interviewId || 'test'}?token=${token}`)
    socketRef.current = socket

    return new Promise<WebSocket>((resolve, reject) => {
      socket.onopen = () => resolve(socket)
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'ai_response') {
          if (msg.data.text) setTranscript(prev => [...prev, { speaker: 'ai', text: msg.data.text }])
          if (msg.data.audio_b64) { 
            console.log(`Audio received: ${msg.data.audio_b64.length} chars (b64)`);
            audioQueue.current.push(msg.data.audio_b64)
            processQueue() 
          }
          if (msg.data.round) setCurrentRound(msg.data.round as InterviewRound)
        } else if (msg.type === 'transcript_update') {
          setTranscript(prev => {
            const last = prev[prev.length - 1]
            if (last?.speaker === msg.data.speaker && last?.text === msg.data.text) return prev
            return [...prev, { speaker: msg.data.speaker, text: msg.data.text }]
          })
        } else if (msg.type === 'scores_update') {
          setScores(prev => ({ ...prev, ...msg.data }))
        } else if (msg.type === 'round_change') {
          setCurrentRound(msg.data.round as InterviewRound)
        } else if (msg.type === 'interview_ended') {
          window.location.href = '/candidate/success'
        }
      }
      socket.onerror = (err) => {
        console.error('WebSocket error', err)
        reject(err)
      }
      socket.onclose = () => console.log('Voice WebSocket closed')
    })
  }

  const startInterview = async () => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    setHasStarted(true)
    await initSocket()
    startMicRecording()
  }
  const startMicRecording = async () => {
    try {
      // Stop any existing recorder first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      // Release any existing mic stream tracks
      micStreamRef.current?.getTracks().forEach(t => t.stop())

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = async (event) => {
        // DUCKING: Only send audio if AI is NOT speaking to avoid hallucination loops
        if (aiSpeakingRef.current) return
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          const reader = new FileReader()
          reader.onloadend = () => {
            // Double-check AI isn't speaking (may have started while reading)
            if (aiSpeakingRef.current) return
            const base64Audio = (reader.result as string).split(',')[1]
            socketRef.current?.send(JSON.stringify({
              type: 'audio_chunk',
              data: { audio_b64: base64Audio }
            }))
          }
          reader.readAsDataURL(event.data)
        }
      }

      // Auto-restart on error (Bug #5 fix)
      recorder.onerror = () => {
        console.error('[Voice] MediaRecorder error, auto-restarting...')
        setTimeout(() => {
          if (micOnRef.current && !aiSpeakingRef.current) {
            startMicRecording()
          }
        }, 1000)
      }

      // Record in 3-second slices for stable Whisper transcription
      recorder.start(3000)
      setMicOn(true)
      micOnRef.current = true
    } catch (err) {
      console.error('[Voice] Failed to start microphone:', err)
      setMicOn(false)
      micOnRef.current = false
    }
  }

  /** Pause mic recording without changing UI state (used during AI speech) */
  const pauseMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    micStreamRef.current?.getTracks().forEach(t => t.stop())
  }

  /** Resume mic recording after AI finishes speaking */
  const resumeMic = () => {
    if (micOnRef.current && !aiSpeakingRef.current) {
      startMicRecording()
    }
  }

  /** Stop AI speech immediately and flush audio queue */
  const stopAISpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    audioQueue.current = []
    isPlaying.current = false
    setAiSpeaking(false)
    aiSpeakingRef.current = false
  }

  /** Handle mic button click — actually stops/starts recording */
  const handleMicToggle = () => {
    if (micOn) {
      // Turn mic OFF — stop MediaRecorder and release hardware
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      setMicOn(false)
      micOnRef.current = false
    } else {
      // Turn mic ON — if AI is speaking, stop it first (like InterviewRoomKit)
      if (aiSpeakingRef.current) {
        stopAISpeech()
      }
      startMicRecording()
    }
  }

  const processQueue = async () => {
    if (isPlaying.current || audioQueue.current.length === 0) return
    isPlaying.current = true
    const base64Audio = audioQueue.current.shift()!

    // Speaker mute check — skip audio playback but keep processing transcript
    if (!speakerOnRef.current) {
      isPlaying.current = false
      processQueue()
      return
    }
    
    try {
      setAiSpeaking(true); aiSpeakingRef.current = true
      // Pause mic while AI speaks to prevent echo/hallucination (Bug #2 fix)
      pauseMic()
      console.log(`Processing audio blob (${base64Audio.length} chars)...`)
      
      // Convert base64 to binary
      const binaryString = window.atob(base64Audio)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      
      audio.onended = () => {
        console.log('Audio blob playback finished.')
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
        setAiSpeaking(false)
        aiSpeakingRef.current = false
        isPlaying.current = false
        // Auto-restart mic after AI finishes (300ms delay like InterviewRoomKit)
        setTimeout(() => resumeMic(), 300)
        processQueue()
      }
      
      audio.onerror = (e) => {
        console.error('Audio element error:', e)
        currentAudioRef.current = null
        setAiSpeaking(false)
        aiSpeakingRef.current = false
        isPlaying.current = false
        setTimeout(() => resumeMic(), 300)
        processQueue()
      }
      
      await audio.play()
    } catch (err) {
      console.error('Audio Playback Critical Error:', err)
      currentAudioRef.current = null
      setAiSpeaking(false); aiSpeakingRef.current = false; isPlaying.current = false
      setTimeout(() => resumeMic(), 300)
      processQueue()
    }
  }

  // Keep speakerOnRef in sync with speakerOn state
  useEffect(() => { speakerOnRef.current = speakerOn }, [speakerOn])

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      audioContextRef.current?.close()
      // Stop recorder AND release hardware (Bug #6 fix)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      // Flush audio queue and stop any playing audio
      stopAISpeech()
    }
  }, [])

  // Handle Round Transitions
  useEffect(() => {
    if (prevRoundRef.current !== currentRound) {
      setShowRoundTransition(true)
      const timer = setTimeout(() => setShowRoundTransition(false), 3000)
      prevRoundRef.current = currentRound
      return () => clearTimeout(timer)
    }
  }, [currentRound])

  useEffect(() => {
    const timer = setInterval(() => {
       if (hasStarted) {
         setElapsed(e => {
           const next = e + 1
           // TEST MODE: Force round transition notification every 60s
           if (next > 0 && next % 60 === 0) {
             console.log("TEST MODE: Round transition trigger at 60s");
           }
           return next
         })
       }
    }, 1000)
    return () => clearInterval(timer)
  }, [hasStarted])

  useEffect(() => {
    if (camOn && videoRef.current) {
      console.log("Interview Room: Requesting Camera access...");
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => { 
          console.log("Interview Room: Camera Stream connected.");
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Camera Autoplay failed:", e));
          }
        })
        .catch(err => {
          console.error("Interview Room: Camera access DENIED or FAILED", err);
        })
    }
  }, [camOn])

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [transcript, aiSpeaking])

  const testVoice = async () => {
    try {
      const socket = await initSocket();
      if (socket.readyState === WebSocket.OPEN) {
        console.log("Sending manual voice test...");
        socket.send(JSON.stringify({
          type: 'transcript',
          data: { text: "Hello, this is a voice test. Can you hear me?", speaker: "ai_test" }
        }))
      }
    } catch (err) {
      console.error("Failed to initialize diagnostic socket:", err);
    }
  }
  const endInterview = () => {
    setIsEnding(true)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'end_interview', data: {} }))
      setTimeout(() => { window.location.href = '/candidate/success' }, 1500)
    } else {
      window.location.href = '/candidate/success'
    }
  }

  const handleSendText = () => {
    if (!inputText.trim() || isSending) return
    setIsSending(true)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'transcript',
        data: { text: inputText, speaker: 'candidate' }
      }))
      setTranscript(prev => [...prev, { speaker: 'candidate', text: inputText }])
      setInputText('')
      setTimeout(() => setIsSending(false), 500)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const currentRoundIndex = rounds.findIndex(r => r.id === currentRound)
  const currentRoundData = rounds.find(r => r.id === currentRound)!

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans" style={{ background: '#0a0c10' }}>
      
      {/* ── Start Overlay ── */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            style={{ background: 'rgba(10,12,16,0.95)' }}
          >
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
              <div className="relative w-full h-full rounded-full bg-brand-600 flex items-center justify-center shadow-2xl shadow-brand-500/40">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Ready for your Interview?</h1>
            <p className="text-white/50 text-center max-w-sm mb-10 leading-relaxed">
              When you click start, we'll initialize your AI interviewer and secure your voice connection. Please find a quiet place.
            </p>
            <button 
              onClick={startInterview}
              className="group flex items-center gap-3 bg-brand-600 hover:bg-brand-700 text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl shadow-brand-600/30 hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              Join Interview Room
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="h-[68px] shrink-0 flex items-center px-6 gap-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,15,22,0.95)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3.5 mr-6">
          <Image src="/hireai-logo.png" alt="HireAI Logo" width={44} height={44} className="rounded-xl shadow-xl object-cover logo-glow" />
          <div>
            <div className="text-white font-black text-lg leading-none tracking-tight">HireAI</div>
            <div className="text-white/30 text-[10px] leading-none mt-1.5 uppercase font-bold tracking-[0.2em]">Interviewer</div>
          </div>
        </div>

        <div className="w-px h-8 mx-2" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Round Progress */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {rounds.map((r, i) => {
              const isCurrent = r.id === currentRound
              const isPast = i < currentRoundIndex
              return (
                <div key={r.id} className="flex items-center">
                  <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-500 uppercase tracking-widest ${
                    isCurrent ? 'text-white' : isPast ? 'text-white/60' : 'text-white/20'
                  }`}
                  style={isCurrent ? { 
                    background: r.color,
                    boxShadow: `0 0 30px ${r.color}40, inset 0 0 10px rgba(255,255,255,0.2)`,
                  } : {}}>
                    {isCurrent && <span className="animate-pulse">{r.icon}</span>}
                    {r.label}
                  </div>
                  {i < rounds.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-10 text-white" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Status + Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            LIVE
          </div>
          <div className="text-white/70 text-sm font-mono font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Video + Controls ── */}
        <div className="flex-1 flex flex-col p-5 gap-5 min-w-0">

          <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
            {/* AI Panel */}
            <div className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0d1117 0%, #131820 100%)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: `0 0 40px rgba(99,102,241,0.08)` }}>
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-xl"
                style={{ background: 'rgba(13,15,22,0.8)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                <Brain className="w-3.5 h-3.5" /> HireAI
              </div>

              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="relative">
                  <PulseRing active={aiSpeaking} color="#6366f1" />
                  <div className={`relative w-48 h-48 rounded-full overflow-hidden transition-all duration-700 ${aiSpeaking ? 'ring-4 ring-brand-500 ring-offset-8 ring-offset-transparent shadow-2xl scale-105' : 'ring-1 ring-white/10 shadow-sm'}`}>
                    <Image src="/avatars/hireai-avatar.png" alt="HireAI" fill className="object-cover" priority />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <VoiceBars active={aiSpeaking} color="#6366f1" size="lg" />
                  <span className="text-[10px] font-black uppercase tracking-[.25em] text-white/30">
                    {aiSpeaking ? 'AI is Speaking' : 'Listening...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera Panel */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: '#111317', border: '1px solid rgba(16,185,129,0.15)' }}>
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[0.2]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-900">
                  <VideoOff className="w-12 h-12 text-white/10" />
                  <span className="text-xs text-white/20 font-bold uppercase tracking-widest">Camera Off</span>
                </div>
              )}
               <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-xl"
                style={{ background: 'rgba(13,15,22,0.8)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                <Mic className="w-3.5 h-3.5" /> YOU
              </div>

              {/* Industrial Integrity Shield UI [UPGRADED] */}
              <AnimatePresence>
                {proctorStatus.isWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 right-0 z-[40] flex items-center justify-center p-4"
                  >
                    <div className="bg-red-600/90 backdrop-blur-xl border border-red-400/50 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-red-600/40">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Security Protocol Breached</span>
                        <span className="text-lg font-black text-white">{proctorStatus.message.split(': ')[1] || proctorStatus.message}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Aura Glow */}
              <div className={`absolute inset-0 z-10 transition-all duration-1000 pointer-events-none ${
                proctorStatus.isWarning ? 'ring-[20px] ring-inset ring-red-600/20' : 'ring-[10px] ring-inset ring-emerald-500/10'
              }`} />

              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-xl transition-colors duration-500"
                style={{ 
                  background: proctorStatus.isWarning ? 'rgba(220,38,38,0.8)' : 'rgba(13,15,22,0.8)', 
                  border: `1px solid ${proctorStatus.isWarning ? 'rgba(255,255,255,0.4)' : 'rgba(16,185,129,0.3)'}`, 
                  color: proctorStatus.isWarning ? 'white' : '#6ee7b7' 
                }}>
                <Shield className={`w-3.5 h-3.5 ${proctorStatus.isWarning ? 'animate-spin' : ''}`} />
                {proctorStatus.isWarning ? 'AI SHIELD: ALERT' : 'AI SHIELD: ACTIVE'}
              </div>

              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-xl text-white/50"
                style={{ background: 'rgba(13,15,22,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {proctorStatus.facesDetected} Face(s) Synchronized
              </div>
            </div>
          </div>

          {/* ── Controls Dock ── */}
          <div className="shrink-0 flex items-center justify-center gap-5">
             <div className="flex items-center gap-4 px-8 py-4 rounded-3xl backdrop-blur-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={handleMicToggle} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-white/5 text-white' : 'bg-red-500/20 text-red-500'}`}>
                  {micOn ? <Mic /> : <MicOff />}
                </button>
                <button onClick={() => setCamOn(!camOn)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${camOn ? 'bg-white/5 text-white' : 'bg-red-500/20 text-red-500'}`}>
                  {camOn ? <Video /> : <VideoOff />}
                </button>
                <button onClick={() => setSpeakerOn(!speakerOn)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/5 text-white`}>
                  {speakerOn ? <Volume2 /> : <VolumeX />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button onClick={endInterview} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-600/20 transition-all active:scale-95">
                  <PhoneOff className="w-4 h-4" /> End Session
                </button>
             </div>
          </div>

          <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl max-w-2xl mx-auto w-full border border-white/10">
            <input 
              type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendText()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent outline-none text-white text-sm" 
            />
            <button onClick={handleSendText} className="p-2.5 bg-brand-600 rounded-xl hover:bg-brand-700">
               <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-96 flex flex-col border-l border-white/5" style={{ background: 'rgba(13,15,22,0.8)' }}>
          <div className="flex border-b border-white/5">
            <button className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-brand-400 border-b-2 border-brand-500">Transcript</button>
            <button className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Insights</button>
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-2 ${msg.speaker === 'ai' ? 'items-start' : 'items-end'}`}>
                 <div className="text-[9px] font-black uppercase tracking-widest text-white/40">{msg.speaker === 'ai' ? 'HireAI' : 'You'}</div>
                 <div className={`px-5 py-4 rounded-2xl text-[13px] leading-relaxed ${
                   msg.speaker === 'ai' ? 'bg-brand-500/10 text-brand-50 border border-brand-500/20 rounded-tl-sm' : 'bg-surface-800 text-white rounded-tr-sm'
                 }`}>
                   {msg.text}
                 </div>
              </div>
            ))}
            {aiSpeaking && (
              <div className="flex gap-1.5 p-4 bg-brand-500/5 rounded-xl border border-brand-500/10 self-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
