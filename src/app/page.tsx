'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { SURF_SPOTS } from '@/app/api/locations'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [surfData, setSurfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingSession, setLoggingSession] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(SURF_SPOTS[0])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchSurfData()
  }, [selectedLocation])

  const fetchSurfData = async () => {
    try {
      const response = await fetch(`/api/surf?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Failed to fetch surf data:', data.error)
        setSurfData(null)
      } else {
        setSurfData(data)
      }
    } catch (error) {
      console.error('Failed to fetch surf data:', error)
      setSurfData(null)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Error:', error)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error:', error)
  }

  const logSession = async () => {
    if (!user) {
      alert('Please sign in to log sessions')
      return
    }

    setLoggingSession(true)
    
    const currentConditions = surfData?.hours?.[0]
    const waveHeight = currentConditions?.waveHeight?.sg || 0
    const wavePeriod = currentConditions?.wavePeriod?.sg || 0
    const windSpeed = currentConditions?.windSpeed?.sg || 0
    
    const sessionData = {
      user_id: user.id,
      location: selectedLocation.name,
      duration: 60,
      board: 'My favorite board',
      rating: 4,
      conditions: `${waveHeight.toFixed(1)}m @ ${wavePeriod.toFixed(0)}s, ${windSpeed.toFixed(0)}km/h wind`,
      notes: 'Quick log from homepage'
    }

    const { error } = await supabase
      .from('surf_sessions')
      .insert([sessionData])

    if (error) {
      console.error('Error logging session:', error)
      alert('Failed to log session')
    } else {
      alert(`Session logged at ${selectedLocation.name}! 🏄‍♂️`)
    }
    
    setLoggingSession(false)
  }

  // Helper function to convert degrees to compass direction
  const degreesToCompass = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(((degrees % 360) / 22.5))
    return directions[index % 16]
  }

  // Helper function to convert meters to feet
  const metersToFeet = (meters: number) => {
    return (meters * 3.28084).toFixed(0)
  }

  // Helper function to get surf height description
  const getSurfDescription = (height: number) => {
    if (height < 0.5) return 'Flat'
    if (height < 1) return 'Knee high'
    if (height < 1.5) return 'Waist high'
    if (height < 2) return 'Chest high'
    if (height < 2.5) return 'Head high'
    if (height < 3) return 'Overhead'
    return '2x overhead'
  }

  // Get wetsuit recommendation based on water temp
  const getWetsuitRecommendation = (temp: number) => {
    if (temp >= 24) return 'Boardshorts'
    if (temp >= 21) return 'Springsuit'
    if (temp >= 18) return '2mm Wetsuit'
    if (temp >= 15) return '3/2 Full Suit'
    return '4/3 Full Suit'
  }

  // Get current conditions
  const currentConditions = surfData?.hours?.[0]
  const waveHeight = currentConditions?.waveHeight?.sg || 0
  const wavePeriod = currentConditions?.wavePeriod?.sg || 0
  const waveDirection = currentConditions?.waveDirection?.sg || 0
  const windSpeed = currentConditions?.windSpeed?.sg || 0
  const windDirection = currentConditions?.windDirection?.sg || 0
  const waterTemp = currentConditions?.waterTemperature?.sg || 20
  const airTemp = currentConditions?.airTemperature?.sg || 22
  const uvIndex = currentConditions?.uvIndex?.sg || 5

  // Calculate tide data (mock for now - you'll need tide API data)
  const currentHour = new Date().getHours()
  const tideHeight = 1.2 + Math.sin((currentHour / 24) * Math.PI * 2) * 0.8
  const nextHighTide = "1:30pm"
  const nextHighHeight = "1.8m"

  // Calculate personalized rating based on conditions
  const getPersonalizedRating = (location: any) => {
    // This would eventually use user preferences and AI
    // For now, using simple logic based on wave height
    const height = waveHeight || 1.5
    const period = wavePeriod || 8
    
    // Mock rating logic (would be personalized based on user profile)
    let rating = 3 // Base rating
    
    // Good wave height for intermediate surfer (1.5-2.5m)
    if (height >= 1.5 && height <= 2.5) rating = 4
    if (height >= 1.8 && height <= 2.2 && period >= 10) rating = 5
    
    // Too small or too big
    if (height < 1) rating = 2
    if (height > 3) rating = 2 // Would be 5 for advanced surfers
    
    return rating
  }

  // Generate star display
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // Condition cards data
  const conditionCards = [
    {
      title: 'SURF HEIGHT',
      mainValue: `${metersToFeet(waveHeight)}-${metersToFeet(waveHeight * 1.2)}ft`,
      subtitle: getSurfDescription(waveHeight),
      details: [
        { label: 'Swell', value: `${waveHeight.toFixed(1)}m @ ${wavePeriod.toFixed(0)}s`, direction: degreesToCompass(waveDirection) },
        { label: 'Secondary', value: `${(waveHeight * 0.7).toFixed(1)}m @ ${(wavePeriod * 0.8).toFixed(0)}s`, direction: degreesToCompass(waveDirection + 45) }
      ]
    },
    {
      title: 'WIND',
      mainValue: `${windSpeed.toFixed(0)}kts ${degreesToCompass(windDirection)}`,
      subtitle: windSpeed < 10 ? 'Light & variable' : windSpeed < 15 ? 'Moderate cross-shore' : 'Strong cross-shore',
      compass: windDirection,
      details: [
        { label: 'Current', value: `${windSpeed.toFixed(0)}kts` },
        { label: 'Gusts', value: `${(windSpeed * 1.2).toFixed(0)}kts` }
      ]
    },
    {
      title: 'TIDE',
      mainValue: `${tideHeight.toFixed(1)}m`,
      subtitle: tideHeight > 1.2 ? 'Rising' : 'Falling',
      details: [
        { label: 'Next High', value: nextHighTide },
        { label: 'Height', value: nextHighHeight }
      ],
      showGraph: true
    },
    {
      title: 'TEMPERATURE',
      customContent: true,
      temps: {
        water: waterTemp,
        air: airTemp,
        recommendation: getWetsuitRecommendation(waterTemp),
        uvIndex: uvIndex
      }
    }
  ]

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % conditionCards.length)
  }

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + conditionCards.length) % conditionCards.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Premium Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Nalu</h1>
              <p className="text-blue-200 text-sm">AI Surf Intelligence</p>
            </div>
            
            {/* Auth Button */}
            <div>
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="text-white/80 text-sm hidden sm:inline">
                    {user?.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all border border-white/20"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/25"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Location Selector - Premium Style with Ratings */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <label className="block text-white mb-3 font-medium">
              📍 Select Surf Spot
            </label>
            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const location = SURF_SPOTS.find((loc: any) => loc.id === e.target.value)
                if (location) setSelectedLocation(location)
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono"
            >
              {SURF_SPOTS.map((location: any) => (
                <option key={location.id} value={location.id} className="bg-slate-800">
                  {location.name} - {location.region} {renderStars(getPersonalizedRating(location))}
                </option>
              ))}
            </select>
            
            {/* Selected Spot Info with Personalized Rating */}
            <div className="mt-3 space-y-2">
              <p className="text-blue-200 text-sm">
                {selectedLocation.description}
              </p>
              
              {/* Personalized Rating Display */}
              <div className="flex items-center gap-3 pt-2">
                <div className="text-yellow-400 text-xl">
                  {renderStars(getPersonalizedRating(selectedLocation))}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="font-medium">For You</span>
                  <span className="text-white/60 ml-2 text-xs">
                    (based on your preferences)
                  </span>
                </div>
              </div>
              
              {/* Rating explanation */}
              <p className="text-blue-200/80 text-xs italic">
                {getPersonalizedRating(selectedLocation) >= 4 
                  ? "Conditions match your sweet spot! Similar to sessions you've rated highly."
                  : getPersonalizedRating(selectedLocation) === 3
                  ? "Decent conditions for your skill level. Could be fun!"
                  : "Not ideal for your preferences, but still surfable."}
              </p>
            </div>
          </div>
        </div>

        {/* Conditions Carousel - Mobile Swipeable */}
        <div className="mb-8">
          {loading ? (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-blue-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span>Checking surf conditions...</span>
                </div>
              </div>
            </div>
          ) : surfData ? (
            <div className="relative">
              {/* Mobile Carousel View */}
              <div className="md:hidden">
                <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                  <div className="p-6">
                    {/* Wind Compass - Inline with main value */}
                    {conditionCards[currentCardIndex].compass !== undefined && (
                      <div className="float-right ml-4">
                        <div className="relative w-24 h-24 bg-white/5 rounded-full border border-white/20">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-1 h-10 bg-white rounded-full"
                              style={{ transform: `rotate(${conditionCards[currentCardIndex].compass}deg)` }}
                            >
                              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-white absolute -top-2 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-white">N</div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/60">S</div>
                          <div className="absolute top-1/2 -right-1 -translate-y-1/2 text-[10px] text-white/60">E</div>
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 text-[10px] text-white/60">W</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tide Graph - Inline with main value */}
                    {conditionCards[currentCardIndex].showGraph && (
                      <div className="float-right ml-4 w-40">
                        <svg className="w-full h-20" viewBox="0 0 300 100">
                          <path
                            d={`M 0,50 Q 75,20 150,50 T 300,50`}
                            fill="none"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="3"
                          />
                          <circle cx={currentHour * 12.5} cy="50" r="4" fill="white" />
                        </svg>
                        <div className="flex justify-between text-[10px] text-white/60 mt-1">
                          <span>12a</span>
                          <span>6a</span>
                          <span>12p</span>
                          <span>6p</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">
                      {conditionCards[currentCardIndex].title}
                    </div>
                    {!conditionCards[currentCardIndex].customContent && (
                      <>
                        <div className="text-4xl font-bold text-white mb-1">
                          {conditionCards[currentCardIndex].mainValue}
                        </div>
                        <div className="text-blue-200 mb-4">
                          {conditionCards[currentCardIndex].subtitle}
                        </div>
                      </>
                    )}
                    
                    {/* Custom Temperature Content */}
                    {conditionCards[currentCardIndex].customContent && conditionCards[currentCardIndex].temps && (
                      <div>
                        {/* Water and Air Temps Side by Side */}
                        <div className="flex items-center justify-around mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl transform -rotate-6 inline-block">🌊</span>
                            <span className="text-2xl font-bold text-white">
                              {conditionCards[currentCardIndex].temps.water.toFixed(0)}°c
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl animate-pulse">☀️</span>
                            <span className="text-2xl font-bold text-white">
                              {conditionCards[currentCardIndex].temps.air.toFixed(0)}°c
                            </span>
                          </div>
                        </div>
                        
                        {/* Wetsuit and SPF Recommendations - Aligned with other cards' details */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Wear</span>
                            <span className="text-white">
                              {conditionCards[currentCardIndex].temps.recommendation}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Protection</span>
                            <span className="text-white">
                              SPF {Math.min(50, conditionCards[currentCardIndex].temps.uvIndex * 10)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Regular Details (for non-temperature cards) */}
                    {!conditionCards[currentCardIndex].customContent && conditionCards[currentCardIndex].details && (
                      <div className="space-y-2">
                        {conditionCards[currentCardIndex].details.map((detail: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-white/60">{detail.label}</span>
                            <span className="text-white">
                              {detail.value} {detail.direction || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Carousel Controls */}
                  <div className="flex items-center justify-between p-4 border-t border-white/20">
                    <button onClick={prevCard} className="text-white/60 hover:text-white">
                      ←
                    </button>
                    <div className="flex gap-2">
                      {conditionCards.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentCardIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                    <button onClick={nextCard} className="text-white/60 hover:text-white">
                      →
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {conditionCards.map((card: any, index: number) => (
                  <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    {/* Wind Compass - Inline for desktop */}
                    {card.compass !== undefined && (
                      <div className="float-right ml-2">
                        <div className="relative w-16 h-16 bg-white/5 rounded-full border border-white/20">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-0.5 h-6 bg-white rounded-full"
                              style={{ transform: `rotate(${card.compass}deg)` }}
                            >
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-white absolute -top-1.5 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                          <div className="text-[8px] text-white/60 absolute -top-0.5 left-1/2 -translate-x-1/2">N</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tide Graph - Inline for desktop */}
                    {card.showGraph && (
                      <div className="float-right ml-2 w-24">
                        <svg className="w-full h-14" viewBox="0 0 300 100">
                          <path
                            d={`M 0,50 Q 75,20 150,50 T 300,50`}
                            fill="none"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="2.5"
                          />
                          <circle cx={currentHour * 12.5} cy="50" r="3" fill="white" />
                        </svg>
                        <div className="flex justify-between text-[8px] text-white/60">
                          <span>12a</span>
                          <span>6a</span>
                          <span>12p</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">
                      {card.title}
                    </div>
                    {!card.customContent && (
                      <>
                        <div className="text-2xl font-bold text-white mb-1">
                          {card.mainValue}
                        </div>
                        <div className="text-sm text-blue-200 mb-3">
                          {card.subtitle}
                        </div>
                      </>
                    )}
                    
                    <div className="clear-both"></div>
                    
                    {/* Custom Temperature Content for Desktop */}
                    {card.customContent && card.temps && (
                      <div>
                        {/* Water and Air Temps Side by Side */}
                        <div className="flex items-center justify-around mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xl transform -rotate-6 inline-block">🌊</span>
                            <span className="text-lg font-bold text-white">
                              {card.temps.water.toFixed(0)}°c
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xl animate-pulse">☀️</span>
                            <span className="text-lg font-bold text-white">
                              {card.temps.air.toFixed(0)}°c
                            </span>
                          </div>
                        </div>
                        
                        {/* Wetsuit and SPF Recommendations - Aligned with other cards' details */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/60">Wear</span>
                            <span className="text-white">
                              {card.temps.recommendation}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/60">Protection</span>
                            <span className="text-white">
                              SPF {Math.min(50, card.temps.uvIndex * 10)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Regular Details (for non-temperature cards) */}
                    {!card.customContent && card.details && (
                      <div className="space-y-1">
                        {card.details.map((detail: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-white/60">{detail.label}</span>
                            <span className="text-white">
                              {detail.value} {detail.direction || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20">
              <div className="text-center">
                <p className="text-red-400">Failed to load surf data</p>
                <button 
                  onClick={fetchSurfData}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Premium Style */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/chat')}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/25"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-2xl">🤖</span>
              <span>Ask Kai about conditions</span>
            </div>
          </button>

          {surfData && session && (
            <button
              onClick={logSession}
              disabled={loggingSession}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-gray-500/25"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-2xl">📊</span>
                <span>{loggingSession ? 'Saving session...' : 'Log my last session'}</span>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-blue-200/60 text-sm">
            Nalu • AI Surf Intelligence • {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  )
}