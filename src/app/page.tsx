'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

interface SurfData {
  waveHeight: number
  wavePeriod: number
  windSpeed: number
  windDirection: number
  temperature: number
  waterTemp: number
}

interface SurfSpot {
  id: string
  name: string
  lat: number
  lng: number
  region: string
  state: string
  breakType: string
  description: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function HomePage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // State management
  const [user, setUser] = useState<{id: string, email?: string} | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "G'day! I'm Kai, your AI surf coach. I can help you check conditions, log sessions, or plan your next surf. What's on your mind?" }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [canvasMode, setCanvasMode] = useState<'chat' | 'locations' | 'forecast' | 'sessions'>('chat')
  const [currentSpot, setCurrentSpot] = useState<SurfSpot>({
    id: 'byron-bay',
    name: 'Byron Bay',
    lat: -28.6439,
    lng: 153.6114,
    region: 'Byron Bay',
    state: 'NSW',
    breakType: 'Beach Break',
    description: 'Australia\'s most easterly point offers consistent waves and a laid-back vibe.'
  })
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Surf spots data
  const surfSpots = [
    {
      id: 'byron-bay',
      name: 'Byron Bay',
      lat: -28.6439,
      lng: 153.6114,
      region: 'Byron Bay',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Australia\'s most easterly point offers consistent waves and a laid-back vibe.'
    },
    {
      id: 'bells-beach',
      name: 'Bells Beach',
      lat: -38.3722,
      lng: 144.2844,
      region: 'Surf Coast',
      state: 'VIC',
      breakType: 'Point Break',
      description: 'Home of the Rip Curl Pro, this iconic right-hand point break delivers world-class waves.'
    },
    {
      id: 'superbank',
      name: 'Superbank',
      lat: -28.1667,
      lng: 153.5333,
      region: 'Gold Coast',
      state: 'QLD',
      breakType: 'Sand Bottom Point',
      description: 'The world\'s longest man-made wave, offering barrels and performance sections.'
    }
  ]

  // Fetch surf data
  const fetchSurfData = useCallback(async () => {
    try {
      setDataLoading(true)
      const response = await fetch(`/api/surf?lat=${currentSpot.lat}&lng=${currentSpot.lng}`)
      const data = await response.json()
      
      if (data.hours && data.hours[0]) {
        setSurfData({
          waveHeight: data.hours[0].waveHeight?.[0] || 0,
          wavePeriod: data.hours[0].wavePeriod?.[0] || 0,
          windSpeed: data.hours[0].windSpeed?.[0] || 0,
          windDirection: data.hours[0].windDirection?.[0] || 0,
          temperature: data.hours[0].airTemperature?.[0] || 20,
          waterTemp: data.hours[0].waterTemperature?.[0] || 18
        })
      }
    } catch (error) {
      console.error('Error fetching surf data:', error)
    } finally {
      setDataLoading(false)
    }
  }, [currentSpot])

  // Initialize user and welcome message
  useEffect(() => {
    const initializeApp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    
    initializeApp()
  }, [router])

  // Fetch surf data when spot changes
  useEffect(() => {
    fetchSurfData()
  }, [currentSpot, fetchSurfData])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message function
  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Build conditions context
      const conditionsContext = surfData ? 
        `Current conditions at ${currentSpot.name}: ${surfData.waveHeight.toFixed(1)}m waves @ ${surfData.wavePeriod.toFixed(0)}s, ${surfData.windSpeed.toFixed(0)}km/h winds, ${surfData.temperature.toFixed(0)}°C air temp` :
        `Location: ${currentSpot.name}, ${currentSpot.region}`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conditionsContext
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const responseText = data.response || 'Sorry, I had trouble processing that.'

      // Add assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    const actions = {
      'log-session': "I'd like to log a surf session",
      'check-conditions': "How are the current conditions?",
      'change-location': () => setCanvasMode('locations')
    }
    
    if (action === 'change-location') {
      actions[action]()
      setLeftPanelOpen(true)
    } else {
      setInputMessage(actions[action as keyof typeof actions] as string)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format wind direction
  const formatWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return directions[Math.round(degrees / 22.5) % 16]
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Left Sidebar */}
      <div className={`bg-slate-800 border-r border-slate-700 transition-all duration-300 ease-in-out ${
        leftPanelOpen ? 'w-80' : 'w-16'
      } flex-shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {leftPanelOpen && (
            <div className="font-semibold text-lg text-white">
              Nalu
            </div>
          )}
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={`p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200 ${
              !leftPanelOpen ? 'mx-auto' : ''
            }`}
          >
            {/* Claude-style sidebar icon */}
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h12M4 14h8" />
            </svg>
          </button>
        </div>

        {/* Navigation Icons */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => setCanvasMode('forecast')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
              canvasMode === 'forecast' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            {leftPanelOpen && (
              <span className="font-medium">Forecast</span>
            )}
          </button>

          <button
            onClick={() => setCanvasMode('sessions')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
              canvasMode === 'sessions' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h4a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {leftPanelOpen && (
              <span className="font-medium">Sessions</span>
            )}
          </button>

          <button
            onClick={() => setCanvasMode('locations')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
              canvasMode === 'locations' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {leftPanelOpen && (
              <span className="font-medium">Locations</span>
            )}
          </button>
        </div>

        {/* Current Location Display */}
        {leftPanelOpen && (
          <div className="px-4 pb-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Current Location</div>
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              <div className="font-medium text-white mb-1">{currentSpot.name}</div>
              <div className="text-sm text-slate-400">{currentSpot.region}, {currentSpot.state}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className={`flex flex-col transition-all duration-300 ${
          canvasMode === 'chat' ? 'flex-1' : 'w-1/2'
        }`}>
          {/* Chat Header */}
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-white">Chat with Kai</h1>
                <p className="text-sm text-slate-400">{currentSpot.name} • {currentSpot.region}</p>
              </div>
              {canvasMode !== 'chat' && (
                <button
                  onClick={() => setCanvasMode('chat')}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-6 py-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-800 text-white border border-blue-700'
                    : 'bg-slate-700 text-white border border-slate-600'
                }`}>
                  <div className="leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 border border-slate-600 px-6 py-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-slate-700/50 p-6">
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              {/* Message Input - Top Row */}
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about conditions, log a session, or get recommendations..."
                className="w-full bg-transparent text-white placeholder-slate-400 resize-none border-0 outline-none text-base leading-relaxed"
                rows={1}
                style={{
                  minHeight: '24px',
                  maxHeight: '120px',
                  height: Math.min(120, Math.max(24, inputMessage.split('\n').length * 24))
                }}
                disabled={loading}
              />
              
              {/* Divider */}
              <div className="border-t border-slate-600 my-3"></div>
              
              {/* Bottom Row - Quick Actions + Send */}
              <div className="flex items-center justify-between">
                {/* Quick Action Buttons - Left */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickAction('log-session')}
                    className="flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('check-conditions')}
                    className="flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('change-location')}
                    className="flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Send Button - Right */}
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="flex items-center justify-center w-8 h-8 bg-blue-800 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 border border-blue-700 hover:border-blue-600 disabled:border-slate-500 rounded-lg transition-all duration-200 text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        {canvasMode !== 'chat' && (
          <div className="w-1/2 border-l border-slate-700">
            {/* Locations Canvas */}
            {canvasMode === 'locations' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-2xl font-semibold text-white mb-8">Select Location</h2>
                <div className="space-y-4">
                  {surfSpots.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => {
                        setCurrentSpot(spot)
                        setCanvasMode('chat')
                      }}
                      className={`w-full p-6 rounded-lg border text-left transition-all duration-200 hover:scale-[1.02] ${
                        currentSpot.id === spot.id
                          ? 'bg-blue-800 border-blue-700 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium text-white mb-1">{spot.name}</div>
                      <div className="text-sm text-slate-400 mb-2">{spot.region} • {spot.breakType}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{spot.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast Canvas */}
            {canvasMode === 'forecast' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-2">{currentSpot.name}</h2>
                  <p className="text-slate-400 mb-1">{currentSpot.region}, {currentSpot.state} • {currentSpot.breakType}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{currentSpot.description}</p>
                </div>

                {dataLoading ? (
                  <div className="bg-slate-700 rounded-lg p-12 text-center">
                    <div className="text-slate-400">Loading conditions...</div>
                  </div>
                ) : surfData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Wave Height */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Wave Height</div>
                      <div className="text-3xl font-semibold text-white mb-2">{surfData.waveHeight.toFixed(1)}m</div>
                      <div className="text-sm text-slate-400">Period: {surfData.wavePeriod.toFixed(0)}s</div>
                    </div>

                    {/* Wind */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Wind</div>
                      <div className="text-3xl font-semibold text-white mb-2">{surfData.windSpeed.toFixed(0)} km/h</div>
                      <div className="text-sm text-slate-400">{formatWindDirection(surfData.windDirection)}</div>
                    </div>

                    {/* Air Temperature */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Air Temp</div>
                      <div className="text-3xl font-semibold text-white">{surfData.temperature.toFixed(0)}°C</div>
                    </div>

                    {/* Water Temperature */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Water Temp</div>
                      <div className="text-3xl font-semibold text-white">{surfData.waterTemp.toFixed(0)}°C</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-12 text-center">
                    <div className="text-slate-400">No surf data available</div>
                  </div>
                )}
              </div>
            )}

            {/* Sessions Canvas */}
            {canvasMode === 'sessions' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-2xl font-semibold text-white mb-8">Session History</h2>
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-12 text-center">
                  <div className="text-slate-400 mb-3">No sessions logged yet</div>
                  <div className="text-sm text-slate-500">Start a conversation with Kai to log your first session!</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}