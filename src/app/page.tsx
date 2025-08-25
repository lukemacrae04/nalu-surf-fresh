'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'
import SessionModal from '../components/SessionModal'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
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
  
  // Session Modal State
  const [sessionModalOpen, setSessionModalOpen] = useState(false)

  // Surf spots data - Complete Australian locations
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
    },
    {
      id: 'manly-beach',
      name: 'Manly Beach',
      lat: -33.7969,
      lng: 151.2886,
      region: 'Northern Beaches',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Sydney\'s premier surf beach with consistent waves and easy access.'
    },
    {
      id: 'bondi-beach',
      name: 'Bondi Beach',
      lat: -33.8915,
      lng: 151.2767,
      region: 'Eastern Suburbs',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'World-famous beach break in the heart of Sydney with reliable surf.'
    },
    {
      id: 'noosa-heads',
      name: 'Noosa Heads',
      lat: -26.3973,
      lng: 153.1235,
      region: 'Sunshine Coast',
      state: 'QLD',
      breakType: 'Point Break',
      description: 'Premium longboard waves with multiple sections and warm water.'
    },
    {
      id: 'margaret-river',
      name: 'Margaret River',
      lat: -33.9544,
      lng: 115.0724,
      region: 'Margaret River',
      state: 'WA',
      breakType: 'Reef Break',
      description: 'World-class reef breaks producing powerful waves for experienced surfers.'
    },
    {
      id: 'torquay',
      name: 'Torquay',
      lat: -38.3306,
      lng: 144.3272,
      region: 'Surf Coast',
      state: 'VIC',
      breakType: 'Beach Break',
      description: 'Birthplace of global surf brands with consistent waves year-round.'
    },
    {
      id: 'burleigh-heads',
      name: 'Burleigh Heads',
      lat: -28.0991,
      lng: 153.4497,
      region: 'Gold Coast',
      state: 'QLD',
      breakType: 'Point Break',
      description: 'Classic right-hand point break with long rides and barrel sections.'
    },
    {
      id: 'lennox-head',
      name: 'Lennox Head',
      lat: -28.7938,
      lng: 153.5938,
      region: 'Northern Rivers',
      state: 'NSW',
      breakType: 'Point Break',
      description: 'Powerful right-hand point break known for its consistency and quality.'
    },
    {
      id: 'the-pass',
      name: 'The Pass',
      lat: -28.6397,
      lng: 153.6089,
      region: 'Byron Bay',
      state: 'NSW',
      breakType: 'Point Break',
      description: 'Byron\'s iconic right-hand point break perfect for longboards and learners.'
    },
    {
      id: 'currumbin',
      name: 'Currumbin',
      lat: -28.1309,
      lng: 153.4886,
      region: 'Gold Coast',
      state: 'QLD',
      breakType: 'Beach Break',
      description: 'Reliable beach break with multiple peaks and good for all levels.'
    },
    {
      id: 'cronulla',
      name: 'Cronulla',
      lat: -34.0583,
      lng: 151.1531,
      region: 'Sutherland Shire',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Sydney\'s southern beaches offering consistent surf close to the city.'
    },
    {
      id: 'dee-why',
      name: 'Dee Why',
      lat: -33.7531,
      lng: 151.2997,
      region: 'Northern Beaches',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Popular beach break with good waves and strong local surf community.'
    },
    {
      id: 'mona-vale',
      name: 'Mona Vale',
      lat: -33.6772,
      lng: 151.3072,
      region: 'Northern Beaches',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Scenic beach break with consistent waves and beautiful surroundings.'
    },
    {
      id: 'wollongong',
      name: 'Wollongong',
      lat: -34.4249,
      lng: 150.8931,
      region: 'Illawarra',
      state: 'NSW',
      breakType: 'Beach Break',
      description: 'Coastal city with multiple surf spots and year-round surfable conditions.'
    }
  ]

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to measure scrollHeight
    textarea.style.height = '24px'
    
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 120

    if (scrollHeight <= maxHeight) {
      // Content fits, expand to show all content, hide scrollbar
      textarea.style.height = `${scrollHeight}px`
      textarea.style.overflowY = 'hidden'
    } else {
      // Content exceeds max height, set to max and show scrollbar
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
    }
  }, [])

  // Fetch surf data
  const fetchSurfData = useCallback(async () => {
    try {
      setDataLoading(true)
      const response = await fetch(`/api/surf?lat=${currentSpot.lat}&lng=${currentSpot.lng}`)
      const data = await response.json()
      
      if (data.hours && data.hours[0]) {
        setSurfData({
          waveHeight: data.hours[0].waveHeight?.sg || 0,
          wavePeriod: data.hours[0].wavePeriod?.sg || 0,
          windSpeed: data.hours[0].windSpeed?.sg || 0,
          windDirection: data.hours[0].windDirection?.sg || 0,
          temperature: data.hours[0].airTemperature?.sg || 20,
          waterTemp: data.hours[0].waterTemperature?.sg || 18
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

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea()
  }, [inputMessage, autoResizeTextarea])

  // Send message function - UPDATED with location intelligence
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
          conditionsContext,
          // NEW: Add current location data for session logging
          currentLocation: {
            spotId: currentSpot.id,
            name: currentSpot.name,
            region: currentSpot.region,
            state: currentSpot.state,
            breakType: currentSpot.breakType,
            coordinates: {
              lat: currentSpot.lat,
              lng: currentSpot.lng
            }
          },
          userId: user?.id
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

  // Handle quick actions - UPDATED to trigger session modal
  const handleQuickAction = (action: string) => {
    const actions = {
      'log-session': () => setSessionModalOpen(true), // Open modal instead of conversational flow
      'check-conditions': "How are the current conditions?",
      'change-location': () => setCanvasMode('locations')
    }
    
    if (action === 'change-location') {
      actions[action]()
      setLeftPanelOpen(true)
    } else if (action === 'log-session') {
      actions[action]() // Open modal
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

  // Handle session modal close with success feedback that emphasizes learning
  const handleSessionModalClose = () => {
    setSessionModalOpen(false)
    // Add success message that reinforces the "gets smarter" mission
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "Session logged! I'm learning your preferences with every session you track. Once you set up your board quiver in preferences, I'll start recommending which board to bring based on your performance data! 🤙" 
    }])
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Left Sidebar - IMPROVED mobile behavior */}
      <div className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 ease-in-out z-30 ${
        leftPanelOpen ? 'w-72 md:w-80' : 'w-16'
      }`}>
        {/* Header */}
        <div className="flex items-center p-4 border-b border-slate-700">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200"
          >
            {/* Sidebar toggle button: EXPLICIT 20px sizing */}
            <svg className="text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
              <rect x="3" y="6" width="18" height="12" strokeWidth={2} rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6v12" />
            </svg>
          </button>
          {leftPanelOpen && (
            <div className="font-semibold text-lg text-white ml-3">
              Nalu
            </div>
          )}
        </div>

        {/* Navigation Icons - CONSISTENT BUTTON SIZING */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => setCanvasMode('forecast')}
            className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
              canvasMode === 'forecast' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            {/* Navigation items: EXPLICIT 20px with consistent button sizing */}
            <svg className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            {leftPanelOpen && (
              <span className="font-medium">Forecast</span>
            )}
          </button>

          <button
            onClick={() => setCanvasMode('sessions')}
            className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
              canvasMode === 'sessions' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            {/* Navigation items: EXPLICIT 20px with consistent button sizing */}
            <svg className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h4a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {leftPanelOpen && (
              <span className="font-medium">Sessions</span>
            )}
          </button>

          <button
            onClick={() => setCanvasMode('locations')}
            className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
              canvasMode === 'locations' 
                ? 'bg-blue-800 border border-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-300'
            } ${leftPanelOpen ? 'gap-3' : 'justify-center'}`}
          >
            {/* Navigation items: EXPLICIT 20px with consistent button sizing */}
            <svg className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
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

      {/* Main Content Area - IMPROVED mobile behavior */}
      <div 
        className={`flex flex-col h-full transition-all duration-300 ${
          leftPanelOpen ? 'ml-72 md:ml-80' : 'ml-16'
        } ${canvasMode !== 'chat' ? 'md:mr-[60%]' : ''}`} 
        style={{ 
          width: canvasMode !== 'chat' 
            ? `calc(100% - ${leftPanelOpen ? '288px' : '64px'} - 0px)` // Mobile: improved width calculation
            : `calc(100% - ${leftPanelOpen ? '288px' : '64px'})`
        }}
      >
        {/* Chat Header */}
        <div className="border-b border-slate-700 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-white">Chat with Kai</h1>
              <p className="text-sm text-slate-400">{currentSpot.name} • {currentSpot.region}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[80%] px-4 md:px-6 py-3 md:py-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-800 text-white border border-blue-700'
                  : 'bg-slate-700 text-white border border-slate-600'
              }`}>
                <div className="leading-relaxed text-sm md:text-base">{message.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 border border-slate-600 px-4 md:px-6 py-3 md:py-4 rounded-lg">
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

        {/* Chat Input - IMPROVED mobile keyboard handling */}
        <div className="border-t border-slate-700/50 p-4 md:p-6 pb-safe">
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            {/* Message Input - Top Row */}
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about conditions, log a session, or get recommendations..."
              className="w-full bg-transparent text-white placeholder-slate-400 border-0 outline-none text-base leading-relaxed resize-none overflow-hidden"
              rows={1}
              style={{
                minHeight: '24px',
                maxHeight: '120px'
              }}
              disabled={loading}
            />
            
            {/* Divider */}
            <div className="border-t border-slate-600 my-3"></div>
            
            {/* Bottom Row - Quick Actions + Send */}
            <div className="flex items-center justify-between">
              {/* Quick Action Buttons - Left side: w-4 h-4 */}
              <div className="flex gap-2">
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
                  onClick={() => handleQuickAction('log-session')}
                  className="flex items-center justify-center w-8 h-8 bg-blue-700 hover:bg-blue-600 border border-blue-600 hover:border-blue-500 rounded-lg transition-all duration-200 text-white"
                  disabled={loading}
                  title="Log a surf session - Quick and easy modal!"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleQuickAction('change-location')}
                  className="flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 hover:border-slate-400 rounded-lg transition-all duration-200 text-slate-300 hover:text-white"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                  </svg>
                </button>
              </div>

              {/* Send Button - Right side: w-4 h-4 */}
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

      {/* Canvas Area - IMPROVED mobile overlay behavior */}
      {canvasMode !== 'chat' && (
        <div 
          className="fixed top-0 h-full bg-slate-800 border-l border-slate-700 z-40 transform transition-transform duration-300 ease-in-out right-0 w-full md:w-3/5"
        >
          {/* Locations Canvas */}
          {canvasMode === 'locations' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-700">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Select Location</h2>
                <button
                  onClick={() => setCanvasMode('chat')}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="space-y-4">
                  {surfSpots.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => {
                        setCurrentSpot(spot)
                        setCanvasMode('chat')
                      }}
                      className={`w-full p-4 md:p-6 rounded-lg border text-left transition-all duration-200 hover:scale-[1.02] ${
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
            </div>
          )}

          {/* Forecast Canvas */}
          {canvasMode === 'forecast' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-700">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">{currentSpot.name}</h2>
                  <p className="text-slate-400 mb-1">{currentSpot.region}, {currentSpot.state} • {currentSpot.breakType}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{currentSpot.description}</p>
                </div>
                <button
                  onClick={() => setCanvasMode('chat')}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                {dataLoading ? (
                  <div className="bg-slate-700 rounded-lg p-8 md:p-12 text-center">
                    <div className="text-slate-400">Loading conditions...</div>
                  </div>
                ) : surfData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Wave Height */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 md:p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Wave Height</div>
                      <div className="text-2xl md:text-3xl font-semibold text-white mb-2">{surfData.waveHeight.toFixed(1)}m</div>
                      <div className="text-sm text-slate-400">Period: {surfData.wavePeriod.toFixed(0)}s</div>
                    </div>

                    {/* Wind */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 md:p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Wind</div>
                      <div className="text-2xl md:text-3xl font-semibold text-white mb-2">{surfData.windSpeed.toFixed(0)} km/h</div>
                      <div className="text-sm text-slate-400">{formatWindDirection(surfData.windDirection)}</div>
                    </div>

                    {/* Air Temperature */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 md:p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Air Temp</div>
                      <div className="text-2xl md:text-3xl font-semibold text-white">{surfData.temperature.toFixed(0)}°C</div>
                    </div>

                    {/* Water Temperature */}
                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 md:p-6">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Water Temp</div>
                      <div className="text-2xl md:text-3xl font-semibold text-white">{surfData.waterTemp.toFixed(0)}°C</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 md:p-12 text-center">
                    <div className="text-slate-400">No surf data available</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Canvas */}
          {canvasMode === 'sessions' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-700">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Session History</h2>
                <button
                  onClick={() => setCanvasMode('chat')}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 md:p-12 text-center">
                  <div className="text-slate-400 mb-3">No sessions logged yet</div>
                  <div className="text-sm text-slate-500 mb-4">Start logging sessions to help Nalu become your personal surf coach!</div>
                  <button
                    onClick={() => setSessionModalOpen(true)}
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    Log Your First Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Modal - NEW: Replaces broken conversational flow */}
      <SessionModal
        isOpen={sessionModalOpen}
        onClose={handleSessionModalClose}
        currentSpot={currentSpot}
        forecastData={surfData}
        chatContext={messages}
      />
    </div>
  )
}