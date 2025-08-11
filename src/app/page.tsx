'use client'

import { useState, useEffect, useRef } from 'react'
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
  region: string
  state: string
  coordinates: [number, number]
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
  
  // Mobile viewport optimization
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'
      document.head.appendChild(meta)
    }
  }, [])

  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [canvasMode, setCanvasMode] = useState<'chat' | 'forecast' | 'sessions' | 'locations'>('chat')
  const [searchTerm, setSearchTerm] = useState('')
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm Kai, your AI surf buddy. I can help you with surf conditions, log your sessions, plan trips, or suggest workouts for flat days. What would you like to know?"
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [currentSpot, setCurrentSpot] = useState<SurfSpot>({
    id: 'the-pass-byron',
    name: 'The Pass, Byron Bay',
    region: 'Byron Bay',
    state: 'NSW',
    coordinates: [-28.63764444, 153.62803],
    breakType: 'Point Break',
    description: 'World-class right-hand point break, perfect for longboards and performance surfing'
  })

  // Individual surf spots with exact Surfline coordinates
  const surfSpots: SurfSpot[] = [
    // NSW
    { id: 'manly-north-steyne', name: 'North Steyne, Manly', region: 'Sydney', state: 'NSW', coordinates: [-33.796, 151.2884], breakType: 'Beach Break', description: 'Consistent beach break in the heart of Sydney' },
    { id: 'cronulla-point', name: 'Cronulla Point', region: 'Sydney', state: 'NSW', coordinates: [-34.058, 151.156], breakType: 'Point Break', description: 'Rocky point break south of Sydney' },
    { id: 'the-pass-byron', name: 'The Pass, Byron Bay', region: 'Byron Bay', state: 'NSW', coordinates: [-28.63764444, 153.62803], breakType: 'Point Break', description: 'World-class right-hand point break' },
    { id: 'wategos-byron', name: 'Wategos, Byron Bay', region: 'Byron Bay', state: 'NSW', coordinates: [-28.638, 153.632], breakType: 'Beach Break', description: 'Protected beach break, good for beginners' },
    { id: 'lennox-head', name: 'Lennox Head', region: 'Ballina', state: 'NSW', coordinates: [-28.787, 153.587], breakType: 'Point Break', description: 'Powerful right-hand point break' },
    { id: 'angourie', name: 'Angourie Point', region: 'Yamba', state: 'NSW', coordinates: [-29.459, 153.372], breakType: 'Point Break', description: 'Classic right-hand point break' },
    
    // QLD  
    { id: 'superbank', name: 'Superbank', region: 'Gold Coast', state: 'QLD', coordinates: [-28.025, 153.435], breakType: 'Point Break', description: 'World tour venue, perfect barrels' },
    { id: 'burleigh-heads', name: 'Burleigh Heads', region: 'Gold Coast', state: 'QLD', coordinates: [-28.103, 153.450], breakType: 'Point Break', description: 'Iconic Gold Coast point break' },
    { id: 'currumbin', name: 'Currumbin', region: 'Gold Coast', state: 'QLD', coordinates: [-28.133, 153.486], breakType: 'Point Break', description: 'Consistent point break with long rides' },
    { id: 'snapper-rocks', name: 'Snapper Rocks', region: 'Gold Coast', state: 'QLD', coordinates: [-28.018, 153.434], breakType: 'Point Break', description: 'World-class right-hand point break' },
    { id: 'peregian', name: 'Peregian Beach', region: 'Sunshine Coast', state: 'QLD', coordinates: [-26.480171870235186, 153.0989], breakType: 'Beach Break', description: 'Consistent beach break on Sunshine Coast' },
    { id: 'noosa-first-point', name: 'First Point, Noosa', region: 'Sunshine Coast', state: 'QLD', coordinates: [-26.398, 153.087], breakType: 'Point Break', description: 'Perfect longboard waves' },
    { id: 'caloundra', name: 'Kings Beach, Caloundra', region: 'Sunshine Coast', state: 'QLD', coordinates: [-26.799, 153.139], breakType: 'Beach Break', description: 'Protected beach break' },
    
    // VIC
    { id: 'bells-beach', name: 'Bells Beach', region: 'Surf Coast', state: 'VIC', coordinates: [-38.369, 144.283], breakType: 'Point Break', description: 'Home of the Rip Curl Pro, powerful waves' },
    { id: 'winki-pop', name: 'Winki Pop', region: 'Surf Coast', state: 'VIC', coordinates: [-38.364, 144.278], breakType: 'Point Break', description: 'High-performance right-hand point' },
    { id: 'johanna', name: 'Johanna Beach', region: 'Great Ocean Road', state: 'VIC', coordinates: [-38.752, 143.469], breakType: 'Beach Break', description: 'Remote beach break, powerful waves' },
    { id: 'thirteenth-beach', name: '13th Beach', region: 'Surf Coast', state: 'VIC', coordinates: [-38.233, 144.655], breakType: 'Beach Break', description: 'Consistent beach break near Geelong' },
    
    // WA
    { id: 'margaret-river-main-break', name: 'Main Break, Margaret River', region: 'Margaret River', state: 'WA', coordinates: [-33.953, 115.071], breakType: 'Reef Break', description: 'World tour venue, powerful reef break' },
    { id: 'the-box-margaret-river', name: 'The Box, Margaret River', region: 'Margaret River', state: 'WA', coordinates: [-33.948, 115.066], breakType: 'Reef Break', description: 'Heavy, shallow reef break' },
    { id: 'cottesloe', name: 'Cottesloe Beach', region: 'Perth', state: 'WA', coordinates: [-31.998, 115.759], breakType: 'Beach Break', description: 'Perth city beach break' },
    { id: 'trigg', name: 'Trigg Beach', region: 'Perth', state: 'WA', coordinates: [-31.869, 115.750], breakType: 'Beach Break', description: 'Consistent Perth beach break' },
    
    // SA
    { id: 'middleton', name: 'Middleton Point', region: 'Fleurieu Peninsula', state: 'SA', coordinates: [-35.508, 138.766], breakType: 'Point Break', description: 'Reliable right-hand point break' },
    { id: 'parsons', name: 'Parsons Beach', region: 'Fleurieu Peninsula', state: 'SA', coordinates: [-35.615, 138.497], breakType: 'Beach Break', description: 'Powerful beach break' },
    
    // TAS
    { id: 'clifton-beach', name: 'Clifton Beach', region: 'Hobart', state: 'TAS', coordinates: [-42.945, 147.527], breakType: 'Beach Break', description: 'Consistent beach break near Hobart' }
  ]

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    const prompts = {
      'log-session': "I just finished a surf session and want to log it",
      'check-conditions': "How are the surf conditions right now?",
      'change-spot': "I want to check a different surf spot"
    }
    
    setInputMessage(prompts[action as keyof typeof prompts])
    // Auto-send the message
    setTimeout(() => sendMessage(), 100)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Check if user is asking about conditions
      if (userMessage.toLowerCase().includes('condition') || 
          userMessage.toLowerCase().includes('surf') ||
          userMessage.toLowerCase().includes('waves')) {
        setCanvasMode('forecast')
        await fetchSurfData()
      }

      // Simple AI response
      let response = `Thanks for your message: "${userMessage}". `
      
      if (userMessage.toLowerCase().includes('session') && userMessage.toLowerCase().includes('log')) {
        response += `Great! I'd love to help you log your session. Can you tell me: 
        
1. Which spot did you surf?
2. How long was your session?  
3. How would you rate the waves (1-10)?
4. What board did you use?
5. Any highlights or notes?`
      } else if (userMessage.toLowerCase().includes('condition')) {
        response += `I can see the current conditions for ${currentSpot.name}. The surf data shows ${surfData?.waveHeight}m waves. How can I help you interpret these conditions?`
      } else if (userMessage.toLowerCase().includes('workout') || userMessage.toLowerCase().includes('flat')) {
        response += `Perfect timing for some surf fitness! Here's what I recommend:

🏋️ **Surf Strength Circuit (30 mins):**
- Pop-up practice: 3 sets of 10
- Paddle simulation: 5 minutes
- Core stability holds: 3 x 30 seconds
- Balance board work: 10 minutes

Would you like me to guide you through any specific exercises?`
      } else {
        response += `I'm here to help with surf conditions, session logging, trip planning, and surf fitness. What specific information can I provide?`
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }])

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing that. Can you try again?' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const fetchSurfData = async () => {
    try {
      setLoading(true)
      const [lat, lng] = currentSpot.coordinates
      
      const response = await fetch(`/api/surf-data?lat=${lat}&lng=${lng}`)
      const data = await response.json()
      
      if (data.success) {
        setSurfData(data.data)
      }
    } catch (error) {
      console.error('Error fetching surf data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSpotChange = (spot: SurfSpot) => {
    setCurrentSpot(spot)
    setCanvasMode('forecast')
    setLeftPanelOpen(false)
    
    // Add system message about spot change
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Switched to ${spot.name}. This is a ${spot.breakType.toLowerCase()} in ${spot.region}, ${spot.state}. ${spot.description}. Let me fetch the latest conditions...`
    }])
    
    // Fetch new data
    setTimeout(() => fetchSurfData(), 500)
  }

  // Filter spots for search
  const filteredSpots = surfSpots.filter(spot =>
    spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spot.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spot.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group spots by state
  const groupedSpots = filteredSpots.reduce((groups, spot) => {
    const state = spot.state
    if (!groups[state]) groups[state] = []
    groups[state].push(spot)
    return groups
  }, {} as Record<string, SurfSpot[]>)

  useEffect(() => {
    fetchSurfData()
  }, [currentSpot])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  return (
    <div className="h-screen bg-slate-900 flex relative">
      {/* Collapsible Left Sidebar - Deep Sea Design */}
      <div className={`fixed inset-y-0 left-0 z-50 ${leftPanelOpen ? 'w-64' : 'w-12'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
        {/* Header - Clean spacing */}
        <div className="p-3 border-b border-slate-700">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation Icons - Matching chat action style */}
        <div className="flex-1 p-2 space-y-1">
          {/* Location Icon - Exact same as chat action */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
                    : 'bg-slate-800 text-white border border-slate-700'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-300 px-5 py-4 rounded-lg border border-slate-700">
                  Kai is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - Deep Sea Blue accent */}
          <div className="p-6 border-t border-slate-700 bg-slate-900">
            {/* Text Input - Full width top row */}
            <div className="mb-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Kai anything..."
                className="w-full px-4 py-4 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            {/* Bottom Row: Quick Actions (left) + Send Button (right) */}
            <div className="flex justify-between items-center">
              {/* Quick Action Buttons - Consistent icon sizing */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickAction('log-session')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors duration-300"
                  title="Log Session"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('check-conditions')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors duration-300"
                  title="Check Conditions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleQuickAction('change-spot')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors duration-300"
                  title="Change Spot"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Send Button - Deep Sea Blue */}
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-blue-800 hover:bg-blue-900 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area - Clean content presentation */}
        <div className={`
          ${canvasMode === 'chat' ? 'hidden md:flex' : 'fixed md:relative'}
          ${canvasMode === 'chat' ? '' : 'inset-0 md:inset-auto'}
          md:w-1/2 bg-slate-800 flex flex-col z-30
        `}>
          {/* Mobile Close Button */}
          {canvasMode !== 'chat' && (
            <button
              onClick={() => setCanvasMode('chat')}
              className="md:hidden absolute top-6 right-6 z-40 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors duration-300"
            >
              ✕
            </button>
          )}

          {/* Location Selector Canvas */}
          {canvasMode === 'locations' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-white mb-6">Select Surf Spot</h2>
              
              {/* Search - Improved styling */}
              <div className="mb-8">
                <input
                  type="text"
                  placeholder="Search spots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Grouped Spots - Better spacing */}
              <div className="space-y-8">
                {Object.entries(groupedSpots).map(([state, spots]) => (
                  <div key={state}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">{state}</h3>
                    <div className="space-y-3">
                      {spots.map((spot) => (
                        <button
                          key={spot.id}
                          onClick={() => handleSpotChange(spot)}
                          className={`w-full text-left p-5 rounded-lg border transition-all duration-300 ${
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

              {loading ? (
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
      </div>
    </div>
  )
}