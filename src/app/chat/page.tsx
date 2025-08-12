'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../supabase'  // ← Correct path for chat page
import { useRouter } from 'next/navigation'

interface SurfData {
  waveHeight: number
  wavePeriod: number
  windSpeed: number
  windDirection: number
  temperature: number
  waterTemp: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SurfSpot {
  id: string
  name: string
  region: string
  state: string
  lat: number
  lng: number
  spots: string[]
  description: string
  breakType: string
}

const SURF_LOCATIONS: SurfSpot[] = [
  {
    id: 'byron-bay',
    name: 'Byron Bay',
    region: 'Northern Rivers',
    state: 'NSW', 
    lat: -28.6439,
    lng: 153.6114,
    spots: ['The Pass', 'The Wreck', 'Tallows', 'Wategos'],
    description: 'World-class right-hand point break and consistent beach breaks',
    breakType: 'Point & Beach'
  },
  {
    id: 'gold-coast',
    name: 'Gold Coast',
    region: 'Gold Coast',
    state: 'QLD',
    lat: -28.0167,
    lng: 153.4000,
    spots: ['Superbank', 'Burleigh', 'Currumbin', 'Snapper'],
    description: 'Legendary sandbar breaks and powerful point breaks',
    breakType: 'Sandbar & Point'
  },
  {
    id: 'sunshine-coast',
    name: 'Sunshine Coast', 
    region: 'Sunshine Coast',
    state: 'QLD',
    lat: -26.6500,
    lng: 153.0667,
    spots: ['Noosa', 'Tea Tree', 'Peregian', 'Coolum'],
    description: 'Perfect point breaks and consistent beach breaks',
    breakType: 'Point & Beach'
  }
]

export default function Home() {
  const [user, setUser] = useState<{id: string, email?: string} | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [canvasMode, setCanvasMode] = useState<'chat' | 'locations' | 'forecast' | 'sessions'>('chat')
  const [currentSpot, setCurrentSpot] = useState<SurfSpot>(SURF_LOCATIONS[0])
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize user and welcome message
  useEffect(() => {
    const initializeApp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      
      // Add welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hey! I'm Kai, your AI surf buddy. I can help you with surf conditions, log your sessions, plan trips, or suggest what to do on flat days. Just ask me anything about surfing! What would you like to know?`
      }
      setMessages([welcomeMessage])
    }
    
    initializeApp()
  }, [router])

  const fetchSurfData = useCallback(async () => {
    try {
      setDataLoading(true)
      const response = await fetch(`/api/surf?lat=${currentSpot.lat}&lng=${currentSpot.lng}`)
      const data = await response.json()
      
      if (data.hours && data.hours.length > 0) {
        const current = data.hours[0]
        setSurfData({
          waveHeight: current.waveHeight?.sg || 0,
          wavePeriod: current.wavePeriod?.sg || 0,
          windSpeed: current.windSpeed?.sg || 0,
          windDirection: current.windDirection?.sg || 0,
          temperature: current.airTemperature?.sg || 20,
          waterTemp: current.waterTemperature?.sg || 22
        })
      } else {
        console.error('No surf data available')
      }
    } catch (error) {
      console.error('Error fetching surf data:', error)
    } finally {
      setDataLoading(false)
    }
  }, [currentSpot.lat, currentSpot.lng])

  // Fetch surf data when spot changes
  useEffect(() => {
    fetchSurfData()
  }, [fetchSurfData])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    console.log('🚀 sendMessage called with:', inputMessage)
    
    if (!inputMessage.trim() || loading) {
      console.log('⛔ Early return - empty message or loading')
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          conditionsContext: surfData ? 
            `Current ${currentSpot.name} conditions: ${surfData.waveHeight.toFixed(1)}m waves at ${surfData.wavePeriod.toFixed(0)}s with ${surfData.windSpeed.toFixed(0)}km/h wind.` 
            : ''
        })
      })

      const data = await response.json()
      const responseText = data.response || "Sorry mate, having some technical issues. Try again?"

      console.log('📤 Full response content:', responseText)
      console.log('📏 Response length:', responseText.length)
      console.log('🔤 Response type:', typeof responseText)
      
      // FIXED LINE 196: Clean setMessages call without complex callback
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }])
      
    } catch (error) {
      console.error('💥 Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry mate, having trouble processing that. Can you try again?'
      }])
    } finally {
      setLoading(false)
      console.log('✅ sendMessage completed')
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'log-session':
        setInputMessage("I just finished a surf session at " + currentSpot.name + ". ")
        break
      case 'check-conditions':
        setInputMessage("How's the surf looking right now?")
        break
      case 'change-location':
        setCanvasMode('locations')
        setLeftPanelOpen(true)
        break
    }
  }

  const handleSpotChange = (spot: SurfSpot) => {
    setCurrentSpot(spot)
    setCanvasMode('forecast')
    setLeftPanelOpen(false)
  }

  const formatWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden">
      {/* Left Sidebar - Claude Style */}
      <div className={`${leftPanelOpen ? 'w-64' : 'w-12'} bg-slate-800/90 backdrop-blur-sm border-r border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out relative z-50`}>
        {/* Menu Toggle */}
        <div className="p-2">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation Icons - Consistent simple outline style */}
        <div className="flex-1 p-2 space-y-1">
          {/* Location Icon - Simple map pin */}
          <button
            onClick={() => setCanvasMode('locations')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-300 ${
              canvasMode === 'locations' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Sessions Icon - Simple clipboard/list */}
          <button
            onClick={() => setCanvasMode('sessions')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-300 ${
              canvasMode === 'sessions' ? 'bg-blue-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>

          {/* Fitness Icon - Simple lightning bolt */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 cursor-not-allowed"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          {/* Settings Icon - Simple cog */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 cursor-not-allowed"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Expanded Content - Clean typography */}
        {leftPanelOpen && (
          <div className="px-4 pb-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Navigation</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 py-2 text-slate-300">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Locations
              </div>
              <div className="flex items-center gap-3 py-2 text-slate-300">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Sessions
              </div>
              <div className="flex items-center gap-3 py-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fitness
              </div>
              <div className="flex items-center gap-3 py-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Settings
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex ml-12">
        {/* Chat Area - Generous spacing like Claude */}
        <div className="flex-1 md:w-1/2 bg-slate-900 flex flex-col">
          {/* Chat Messages - Improved readability */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-700 border border-slate-600 text-slate-100'
                }`}>
                  <div className="text-sm leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 border border-slate-600 text-slate-300 px-5 py-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span className="ml-2 text-sm">Kai is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input - Integrated layout */}
          <div className="border-t border-slate-700/50 p-6">
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
              {/* Message Input - Top Row */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message Kai..."
                className="w-full px-0 py-2 bg-transparent text-white placeholder-slate-400 border-none focus:outline-none focus:ring-0 text-lg"
              />
              
              {/* Action Buttons Row - Bottom */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-600 mt-3">
                {/* Quick Action Buttons - Left Side */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickAction('log-session')}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-white transition-colors duration-300"
                    title="Log Session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Log
                  </button>
                  <button
                    onClick={() => handleQuickAction('check-conditions')}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-white transition-colors duration-300"
                    title="Check Conditions"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Check
                  </button>
                  <button
                    onClick={() => handleQuickAction('change-location')}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-white transition-colors duration-300"
                    title="Change Location"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </button>
                </div>

                {/* Send Button - Right Side */}
                <button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-blue-800 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area - Context display */}
        {canvasMode !== 'chat' && (
          <div className="hidden md:flex md:w-1/2 bg-slate-800 border-l border-slate-700/50">
            {/* Locations Canvas */}
            {canvasMode === 'locations' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-2">Surf Locations</h2>
                  <p className="text-slate-400">Choose your surf spot to get conditions and chat with Kai</p>
                </div>

                <div className="space-y-6">
                  {SURF_LOCATIONS.map((location) => (
                    <div key={location.id} className="space-y-2">
                      <h3 className="text-lg font-medium text-white">{location.region}, {location.state}</h3>
                      <div className="grid gap-3">
                        <button
                          onClick={() => handleSpotChange(location)}
                          className={`p-4 rounded-lg border transition-all text-left ${
                            currentSpot.id === location.id
                              ? 'bg-blue-800 border-blue-700 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="font-medium text-white mb-1">{location.name}</div>
                          <div className="text-sm text-slate-400 mb-2">{location.region} • {location.breakType}</div>
                          <div className="text-xs text-slate-500 leading-relaxed">{location.description}</div>
                        </button>
                      </div>
                    </div>
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