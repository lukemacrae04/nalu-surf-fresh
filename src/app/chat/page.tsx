'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SessionData {
  conditions?: string
  duration?: string
  board?: string
  rating?: number
}

export default function Chat() {
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData>({})
  const [step, setStep] = useState(0)
  const [isLoggingMode, setIsLoggingMode] = useState(false)
  const [currentConditions, setCurrentConditions] = useState(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user as User | null)
      if (!user) {
        router.push('/login')
      } else {
        generateSmartGreeting()
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateSmartGreeting = async () => {
    try {
      const surfResponse = await fetch('/api/surf?lat=-28.644&lng=153.612')
      const surfData = await surfResponse.json()
      
      if (surfData.hours && surfData.hours[0]) {
        const current = surfData.hours[0]
        const waveHeight = current.waveHeight?.sg || 0
        const wavePeriod = current.wavePeriod?.sg || 0
        const windSpeed = current.windSpeed?.sg || 0
        
        setCurrentConditions(current)
        
        const greeting = `G'day! Right now Byron Bay is showing ${waveHeight.toFixed(1)}m waves at ${wavePeriod.toFixed(0)}s with ${windSpeed.toFixed(0)}km/h wind. Looks like decent conditions for a surf! Want to check it out, or just finished a session?`
        
        setMessages([{
          role: 'assistant',
          content: greeting
        }])
      } else {
        setMessages([{
          role: 'assistant',
          content: "G'day! How's it going? Thinking about surfing today or just got back from a session?"
        }])
      }
    } catch (error) {
      console.error('Error generating greeting:', error)
      setMessages([{
        role: 'assistant',
        content: "G'day! How's it going? Thinking about surfing today or just got back from a session?"
      }])
    }
  }

  const saveSession = async (data: SessionData) => {
    if (!user || !data.duration || !data.board || !data.rating) return false

    try {
      const durationMinutes = parseInt(data.duration.match(/(\d+)/)?.[1] || '60') * 60
      
      const { error } = await supabase
        .from('surf_sessions')
        .insert([
          {
            user_id: user.id,
            location: 'Byron Bay, Australia',
            date: new Date().toISOString().split('T')[0],
            board_used: data.board,
            conditions: data.conditions || 'Good session',
            rating: data.rating,
            notes: 'Logged via Kai chat',
            duration_minutes: durationMinutes
          }
        ])

      if (error) {
        console.error('Save error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Save error:', error)
      return false
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setMessages(prev => prev.concat([{ role: 'user', content: userMessage }]))
    setLoading(true)

    try {
      const sessionKeywords = /just (had|finished|got back|surfed)|session|surfed|came in|got out/i

      if (!isLoggingMode && sessionKeywords.test(userMessage)) {
        setIsLoggingMode(true)
        setSessionData({ conditions: userMessage })
        setStep(1)
        setMessages(prev => prev.concat([{
          role: 'assistant',
          content: "Awesome! How long were you out?"
        }]))
      } else if (isLoggingMode) {
        const newSessionData = { ...sessionData }
        let nextQuestion = ''

        if (step === 1) {
          newSessionData.duration = userMessage
          nextQuestion = 'What board did you use?'
          setStep(2)
        } else if (step === 2) {
          newSessionData.board = userMessage
          nextQuestion = 'Rate the session 1-5?'
          setStep(3)
        } else if (step === 3) {
          const rating = parseInt(userMessage)
          if (rating >= 1 && rating <= 5) {
            newSessionData.rating = rating
            
            const saveSuccess = await saveSession(newSessionData)
            
            if (saveSuccess) {
              setMessages(prev => prev.concat([{
                role: 'assistant',
                content: "Perfect! Session logged successfully 🏄‍♂️ Want to chat about anything else?"
              }]))
              setIsLoggingMode(false)
              setSessionData({})
              setStep(0)
            } else {
              setMessages(prev => prev.concat([{
                role: 'assistant',
                content: "Got all your details but having trouble saving. Try again later!"
              }]))
            }
            setLoading(false)
            return
          } else {
            nextQuestion = 'Please enter a number from 1-5 for the rating.'
          }
        }

        setSessionData(newSessionData)
        if (nextQuestion) {
          setMessages(prev => prev.concat([{
            role: 'assistant',
            content: nextQuestion
          }]))
        }
      } else {
        const forecastKeywords = /tomorrow|next|later|should i surf/i
        const isForecastRequest = forecastKeywords.test(userMessage)
        
        let conditionsContext = ""
        
        if (currentConditions) {
          const waveHeight = currentConditions?.['waveHeight']?.['sg'] || 0
          const wavePeriod = currentConditions?.['wavePeriod']?.['sg'] || 0
          const windSpeed = currentConditions?.['windSpeed']?.['sg'] || 0
          conditionsContext = `Current Byron Bay conditions: ${Number(waveHeight).toFixed(1)}m waves at ${Number(wavePeriod).toFixed(0)}s with ${Number(windSpeed).toFixed(0)}km/h wind. `
        }

        const conversationHistory = messages.concat([{ role: 'user', content: userMessage }])

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: conversationHistory,
            conditionsContext: conditionsContext,
            userId: user?.id
          })
        })

        const data = await response.json()
        setMessages(prev => prev.concat([{
          role: 'assistant',
          content: data.response || "Let me think about that surf advice..."
        }]))
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.concat([{
        role: 'assistant',
        content: "Something went wrong. Let's try that again."
      }]))
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-2 text-blue-200">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
              🏄‍♂️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Chat with Kai</h1>
              <p className="text-sm text-blue-200">Your AI surf buddy</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-200 hover:text-white transition-colors px-3 py-1 rounded-lg border border-blue-400/30 hover:border-blue-400/60"
          >
            ← Back
          </button>
        </div>
        
        {/* Chat Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl h-[500px] flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[280px] px-4 py-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                    : 'bg-white/90 backdrop-blur-sm text-slate-800 shadow-md border border-white/30'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-sm text-slate-600 px-4 py-3 rounded-2xl shadow-md border border-white/30">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm">Kai is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-white/20 bg-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message Kai..."
                className="flex-1 px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 placeholder-slate-500"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg disabled:shadow-none"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <p className="text-center text-blue-200/60 text-xs mt-4">
          Ask about conditions • Log sessions • Get surf advice
        </p>
      </div>
    </div>
  )
}