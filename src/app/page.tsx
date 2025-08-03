'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

interface SurfData {
  waveHeight: number
  wavePeriod: number
  windSpeed: number
}

interface User {
  id: string
  email?: string
}

export default function Home() {
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [loggingSession, setLoggingSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user as User | null)
      if (!user) {
        router.push('/login')
      }
    }
    getUser()

    fetch('/api/surf?lat=-28.644&lng=153.612')
      .then(response => response.json())
      .then(data => {
        if (data.hours && data.hours.length > 0) {
          const current = data.hours[0]
          setSurfData({
            waveHeight: current.waveHeight?.sg || 0,
            wavePeriod: current.wavePeriod?.sg || 0,
            windSpeed: current.windSpeed?.sg || 0
          })
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [router])

  const logSession = async () => {
    if (!surfData || !user) return
    
    setLoggingSession(true)
    try {
      const { error } = await supabase
        .from('surf_sessions')
        .insert([
          {
            user_id: user.id,
            location: 'Byron Bay, Australia',
            date: new Date().toISOString().split('T')[0],
            board_used: 'Default Board',
            conditions: `${surfData.waveHeight.toFixed(1)}m @ ${surfData.wavePeriod}s, ${surfData.windSpeed}km/h wind`,
            rating: 5,
            notes: 'Logged from Nalu app',
            duration_minutes: 60
          }
        ])
      
      if (error) throw error
      alert('Session logged successfully! 🏄‍♂️')
    } catch (error) {
      console.error('Error logging session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to log session: ' + errorMessage)
    }
    setLoggingSession(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
            🏄‍♂️ Nalu Surf
          </h1>
          <button 
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-md mb-4">
          <h2 className="text-lg font-semibold mb-3">Byron Bay, Australia</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading surf conditions...</p>
          ) : surfData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Wave Height:</span>
                <span className="font-semibold">{surfData.waveHeight.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-semibold">{surfData.wavePeriod.toFixed(0)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wind:</span>
                <span className="font-semibold">{surfData.windSpeed.toFixed(0)} km/h</span>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Failed to load surf data</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            💬 Chat with Kai
            <span className="text-sm opacity-90">- Log your session</span>
          </button>

          {surfData && (
            <button
              onClick={logSession}
              disabled={loggingSession}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loggingSession ? 'Logging Session...' : '🏄‍♂️ Quick Log Session'}
            </button>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Welcome back, {user?.email?.split('@')[0] || 'Surfer'}!
        </p>
      </div>
    </div>
  )
}