'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

interface SurfData {
  waveHeight: number
  wavePeriod: number
  windSpeed: number
  windDirection: number
  swellDirection: number
  temperature: number
  waterTemp: number
  uvIndex: number
}

interface User {
  id: string
  email?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SurfSpot {
  id: string
  name: string
  lat: number
  lng: number
  region: string
  type: string
  description: string
}

const surfSpots: SurfSpot[] = [
  // NSW - Byron Bay Area
  { id: 'the-pass', name: 'The Pass, Byron Bay', lat: -28.63764444, lng: 153.62803, region: 'NSW', type: 'Point Break', description: 'World-famous right-hand point break' },
  { id: 'main-beach-byron', name: 'Main Beach, Byron Bay', lat: -28.641084, lng: 153.61461, region: 'NSW', type: 'Beach Break', description: 'Consistent beach break in town' },
  { id: 'tallows-beach', name: 'Tallows Beach', lat: -28.658, lng: 153.615, region: 'NSW', type: 'Beach Break', description: 'Long beach break south of Byron' },
  { id: 'wategos', name: 'Wategos Beach', lat: -28.630, lng: 153.635, region: 'NSW', type: 'Beach Break', description: 'Protected bay perfect for beginners' },
  
  // NSW - Lennox Head
  { id: 'lennox-point', name: 'Lennox Head Point', lat: -28.793, lng: 153.587, region: 'NSW', type: 'Point Break', description: 'Powerful right-hand point break' },
  
  // NSW - Sydney Northern Beaches
  { id: 'manly-north-steyne', name: 'Manly North Steyne', lat: -33.796, lng: 151.2884, region: 'NSW', type: 'Beach Break', description: 'Sydney\'s premier surf beach' },
  { id: 'dee-why', name: 'Dee Why', lat: -33.754, lng: 151.298, region: 'NSW', type: 'Beach Break', description: 'Consistent northern beaches break' },
  { id: 'freshwater', name: 'Freshwater', lat: -33.778, lng: 151.289, region: 'NSW', type: 'Beach Break', description: 'Historic surf beach' },
  
  // NSW - Sydney Eastern Beaches
  { id: 'bondi', name: 'Bondi Beach', lat: -33.890542, lng: 151.274856, region: 'NSW', type: 'Beach Break', description: 'World\'s most famous city beach' },
  { id: 'bronte', name: 'Bronte Beach', lat: -33.903, lng: 151.268, region: 'NSW', type: 'Beach Break', description: 'Consistent waves in eastern suburbs' },
  { id: 'coogee', name: 'Coogee Beach', lat: -33.921, lng: 151.258, region: 'NSW', type: 'Beach Break', description: 'Southern beaches surf spot' },
  
  // NSW - South Coast
  { id: 'currarong', name: 'Currarong', lat: -35.012, lng: 150.821, region: 'NSW', type: 'Beach Break', description: 'South coast quality waves' },
  { id: 'merimbula', name: 'Merimbula', lat: -36.88901, lng: 149.90961, region: 'NSW', type: 'Beach Break', description: 'Far south coast surf town' },
  
  // QLD - Gold Coast
  { id: 'superbank', name: 'Superbank', lat: -28.025, lng: 153.435, region: 'QLD', type: 'Point Break', description: 'World\'s longest mechanical wave' },
  { id: 'burleigh-heads', name: 'Burleigh Heads', lat: -28.089, lng: 153.447, region: 'QLD', type: 'Point Break', description: 'Classic Gold Coast point break' },
  { id: 'north-burleigh', name: 'North Burleigh', lat: -28.074104, lng: 153.44651, region: 'QLD', type: 'Beach Break', description: 'Quality beach break waves' },
  { id: 'currumbin', name: 'Currumbin', lat: -28.135, lng: 153.485, region: 'QLD', type: 'Point Break', description: 'Right-hand point break' },
  
  // QLD - Sunshine Coast
  { id: 'peregian', name: 'Peregian', lat: -26.480171870235186, lng: 153.0989, region: 'QLD', type: 'Beach Break', description: 'Sunshine Coast quality waves' },
  { id: 'noosa', name: 'Noosa Main Beach', lat: -26.392, lng: 153.097, region: 'QLD', type: 'Point Break', description: 'Protected longboard waves' },
  
  // VIC - Surf Coast
  { id: 'bells-beach', name: 'Bells Beach', lat: -38.373, lng: 144.279, region: 'VIC', type: 'Point Break', description: 'Home of the Rip Curl Pro' },
  { id: 'winki-pop', name: 'Winki Pop', lat: -38.365, lng: 144.285, region: 'VIC', type: 'Point Break', description: 'Perfect right-hand point' },
  
  // WA - Margaret River
  { id: 'main-break', name: 'Margaret River Main Break', lat: -33.955, lng: 115.072, region: 'WA', type: 'Reef Break', description: 'Powerful left-hand reef break' },
  { id: 'smiths-beach', name: 'Smiths Beach', lat: -33.65705556, lng: 115.01457, region: 'WA', type: 'Beach Break', description: 'Margaret River region beach break' },
  
  // SA - Adelaide
  { id: 'north-beach-adelaide', name: 'North Beach', lat: -33.8961, lng: 137.6259, region: 'SA', type: 'Beach Break', description: 'Adelaide metro surf beach' }
]

export default function ChatFirstHomepage() {
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSpot, setCurrentSpot] = useState<SurfSpot>(surfSpots[0])
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [canvasMode, setCanvasMode] = useState<'chat' | 'forecast' | 'sessions' | 'locations'>('chat')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `Hey! I'm Kai, your AI surf buddy. I can help you with surf conditions, log your sessions, plan trips, or suggest workouts for flat days. What would you like to know?`
    }
    setMessages([welcomeMessage])
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auth check
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user as User | null)
      if (!user) {
        router.push('/login')
      }
    }
    getUser()
  }, [router])

  // Fetch surf data for current spot
  useEffect(() => {
    if (currentSpot) {
      fetchSurfData()
    }
  }, [currentSpot])

  const fetchSurfData = async () => {
    try {
      const response = await fetch(`/api/surf?lat=${currentSpot.lat}&lng=${currentSpot.lng}`)
      const data = await response.json()
      
      if (data.hours && data.hours.length > 0) {
        const current = data.hours[0]
        setSurfData({
          waveHeight: current.waveHeight?.sg || 0,
          wavePeriod: current.wavePeriod?.sg || 0,
          windSpeed: current.windSpeed?.sg || 0,
          windDirection: current.windDirection?.sg || 0,
          swellDirection: current.swellDirection?.sg || 0,
          temperature: current.airTemperature?.sg || 20,
          waterTemp: current.waterTemperature?.sg || 20,
          uvIndex: current.uvIndex?.sg || 5
        })
      }
    } catch (error) {
      console.error('Error fetching surf data:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Check if user is asking about conditions - switch to forecast canvas
      if (userMessage.toLowerCase().includes('condition') || 
          userMessage.toLowerCase().includes('surf') ||
          userMessage.toLowerCase().includes('forecast')) {
        setCanvasMode('forecast')
      }

      // Check if user is asking about sessions
      if (userMessage.toLowerCase().includes('session') ||
          userMessage.toLowerCase().includes('log')) {
        setCanvasMode('sessions')
      }

      // Create conditions context for AI
      let conditionsContext = ""
      if (surfData) {
        const windDir = getDirectionFromDegrees(surfData.windDirection)
        const swellDir = getDirectionFromDegrees(surfData.swellDirection)
        conditionsContext = `Current ${currentSpot.name} conditions: ${surfData.waveHeight.toFixed(1)}m waves at ${surfData.wavePeriod.toFixed(0)}s, ${surfData.windSpeed.toFixed(0)}km/h ${windDir} wind, swell from ${swellDir}. `
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.concat([{ role: 'user', content: userMessage }]),
          conditionsContext: conditionsContext,
          location: currentSpot.name,
          userId: user?.id
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "Sorry, I'm having some technical issues. Try asking again!"
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something went wrong. Let's try that again."
      }])
    }
    setLoading(false)
  }

  const getDirectionFromDegrees = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const handleSpotChange = (spot: SurfSpot) => {
    setCurrentSpot(spot)
    setCanvasMode('forecast')
    
    // Add system message about spot change
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Switched to ${spot.name}. Checking conditions now...`
    }])
  }

  const renderLocationsCanvas = () => {
    // Filter spots based on search term
    const filteredSpots = surfSpots.filter(spot =>
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Group filtered spots by region
    const groupedSpots = filteredSpots.reduce((acc, spot) => {
      if (!acc[spot.region]) {
        acc[spot.region] = []
      }
      acc[spot.region].push(spot)
      return acc
    }, {} as Record<string, SurfSpot[]>)

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Select Surf Spot</h2>
          <div className="text-blue-200">Choose from 25+ Australian surf breaks</div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search spots, regions, break types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute right-3 top-3 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Grouped Spot List */}
        <div className="space-y-6">
          {Object.entries(groupedSpots).map(([region, spots]) => (
            <div key={region} className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-200">{region}</h3>
              <div className="grid gap-2">
                {spots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotChange(spot)}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      currentSpot.id === spot.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{spot.name}</div>
                        <div className="text-xs text-white/60 mt-1">{spot.type}</div>
                        <div className="text-xs text-white/50 mt-1">{spot.description}</div>
                      </div>
                      {currentSpot.id === spot.id && (
                        <div className="text-blue-200">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredSpots.length === 0 && (
          <div className="text-center py-8">
            <div className="text-white/60 mb-2">No spots found</div>
            <div className="text-sm text-white/40">Try a different search term</div>
          </div>
        )}
      </div>
    )
  }

  const renderForecastCanvas = () => {
    if (!surfData) return <div className="p-8 text-center text-white/60">Loading conditions...</div>

    const windDir = getDirectionFromDegrees(surfData.windDirection)
    const swellDir = getDirectionFromDegrees(surfData.swellDirection)

    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{currentSpot.name}</h2>
          <div className="text-blue-200">{currentSpot.type} • {currentSpot.region}</div>
          <div className="text-sm text-blue-300 mt-1">{currentSpot.description}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Surf Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Surf</div>
            <div className="text-2xl font-bold text-white mb-1">
              {surfData.waveHeight.toFixed(1)}m
            </div>
            <div className="text-sm text-blue-200 mb-3">{surfData.wavePeriod.toFixed(0)}s period</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Swell</span>
                <span className="text-white">{swellDir}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Direction</span>
                <span className="text-white">{surfData.swellDirection.toFixed(0)}°</span>
              </div>
            </div>
          </div>

          {/* Wind Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Wind</div>
            <div className="text-2xl font-bold text-white mb-1">
              {surfData.windSpeed.toFixed(0)}km/h
            </div>
            <div className="text-sm text-blue-200 mb-3">{windDir}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Direction</span>
                <span className="text-white">{surfData.windDirection.toFixed(0)}°</span>
              </div>
            </div>
          </div>

          {/* Temperature Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Temperature</div>
            <div className="flex items-center justify-around mb-1">
              <div className="flex items-center gap-1">
                <span className="text-lg">💧</span>
                <span className="text-lg font-bold text-white">{surfData.waterTemp.toFixed(0)}°c</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">☀️</span>
                <span className="text-lg font-bold text-white">{surfData.temperature.toFixed(0)}°c</span>
              </div>
            </div>
            <div className="text-sm text-blue-200 mb-3">2mm Wetsuit</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">UV Protection</span>
                <span className="text-white">SPF {Math.min(50, surfData.uvIndex * 10)}</span>
              </div>
            </div>
          </div>

          {/* Spot Info Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Spot Info</div>
            <div className="space-y-2">
              <div className="text-sm text-white font-medium">{currentSpot.type}</div>
              <div className="text-xs text-blue-200">{currentSpot.region}</div>
              <div className="text-xs text-white/80">{currentSpot.description}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSessionsCanvas = () => {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Session History</h2>
          <div className="text-blue-200">Your surf sessions</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
          <div className="text-white/60 mb-4">Session history view coming soon!</div>
          <div className="text-sm text-blue-200">
            For now, chat with Kai to log your sessions conversationally.
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-2 text-white/60">Loading...</p>
      </div>
    </div>
  }

  return (
    <div className="h-screen bg-slate-900 flex relative">
      {/* Collapsible Left Sidebar - Overlay Mode */}
      <div className={`fixed inset-y-0 left-0 z-50 ${leftPanelOpen ? 'w-64' : 'w-12'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
        {/* Header with Hamburger Menu */}
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Title and Sign Out - Only show when expanded */}
            {leftPanelOpen && (
              <>
                <h1 className="text-white font-semibold">Nalu</h1>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
          {leftPanelOpen && (
            <div className="text-sm text-slate-400 mt-1">{currentSpot.name}</div>
          )}
        </div>

        {/* Navigation Icons - Always show (collapsed or expanded) */}
        <div className="p-2 space-y-1">
          {!leftPanelOpen ? (
            // Collapsed - Show only icons (Claude behavior)
            <>
              <button
                onClick={() => setCanvasMode('locations')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  canvasMode === 'locations' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Locations"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={() => setCanvasMode('sessions')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  canvasMode === 'sessions' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Sessions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 cursor-not-allowed opacity-50"
                disabled
                title="Preferences (Coming Soon)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 cursor-not-allowed opacity-50"
                disabled
                title="Fitness (Coming Soon)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </>
          ) : (
            // Expanded - Show full buttons with text
            <>
              <button
                onClick={() => setCanvasMode('locations')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  canvasMode === 'locations' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                📍 Locations
              </button>

              <button
                onClick={() => setCanvasMode('sessions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  canvasMode === 'sessions' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                📊 Sessions
              </button>

              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-500 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                🎯 Preferences
              </button>

              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-500 cursor-not-allowed"
                disabled
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                💪 Fitness
              </button>
            </>
          )}
        </div>

        {/* Surf Spots List - Removed from sidebar */}
      </div>

      {/* Main Content Area - Responsive Layout */}
      <div className="flex-1 flex ml-12">
        {/* Chat Area - Full width on mobile, 50% on desktop */}
        <div className="flex-1 md:w-1/2 bg-slate-900 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-4 py-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-white'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-white px-4 py-3 rounded-lg">
                  Kai is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-6 border-t border-slate-700">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Kai anything about surf..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area - Overlay on mobile, side-by-side on desktop */}
        <div className={`
          ${canvasMode === 'chat' ? 'hidden md:flex' : 'fixed md:relative'}
          ${canvasMode === 'chat' ? '' : 'inset-0 md:inset-auto'}
          ${canvasMode === 'chat' ? '' : 'z-40 md:z-auto'}
          ${canvasMode === 'chat' ? '' : 'ml-12 md:ml-0'}
          md:w-1/2 bg-slate-800 border-l border-slate-700 overflow-y-auto
        `}>
          {/* Mobile Close Button */}
          {canvasMode !== 'chat' && (
            <button
              onClick={() => setCanvasMode('chat')}
              className="md:hidden absolute top-4 right-4 z-50 w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {canvasMode === 'locations' && renderLocationsCanvas()}
          {canvasMode === 'forecast' && renderForecastCanvas()}
          {canvasMode === 'sessions' && renderSessionsCanvas()}
          {canvasMode === 'chat' && (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center text-slate-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg mb-2">Chat with Kai</p>
                <p className="text-sm">Ask about surf conditions, log sessions, or plan trips</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}