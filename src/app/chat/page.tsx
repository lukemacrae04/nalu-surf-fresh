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
      // Get current surf conditions
      const surfResponse = await fetch('/api/surf?lat=-28.644&lng=153.612')
      const surfData = await surfResponse.json()
      
      if (surfData.hours && surfData.hours[0]) {
        const current = surfData.hours[0]
        const waveHeight = current.waveHeight?.sg || 0
        const wavePeriod = current.wavePeriod?.sg || 0
        const windSpeed = current.windSpeed?.sg || 0
        
        setCurrentConditions(current) // Store for later use
        
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
      // Detect if user wants to log a session
      const sessionKeywords = /just (had|finished|got back|surfed)|session|surfed|came in|got out/i

      if (!isLoggingMode && sessionKeywords.test(userMessage)) {
        // Switch to session logging mode
        setIsLoggingMode(true)
        setSessionData({ conditions: userMessage })
        setStep(1)
        setMessages(prev => prev.concat([{
          role: 'assistant',
          content: "Awesome! How long were you out?"
        }]))
      } else if (isLoggingMode) {
        // Continue session logging flow
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
        // General surf advice using Claude AI with current conditions
        const conversationHistory = messages.concat([{ role: 'user', content: userMessage }])
        
        let conditionsContext = ""
        if (currentConditions) {
        const waveHeight = currentConditions?.['waveHeight']?.['sg'] || 0
const wavePeriod = currentConditions?.['wavePeriod']?.['sg'] || 0
const windSpeed = currentConditions?.['windSpeed']?.['sg'] || 0
conditionsContext = `Current Byron Bay conditions: ${Number(waveHeight).toFixed(1)}m waves at ${Number(wavePeriod).toFixed(0)}s with ${Number(windSpeed).toFixed(0)}km/h wind. `
        }

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
    return <div className="min-h-screen bg-blue-50 p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-900">
            🏄‍♂️ Chat with Kai
          </h1>
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Back to Conditions
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  Kai is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message Kai..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}