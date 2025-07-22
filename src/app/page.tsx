'use client'

import { useState, useEffect } from 'react'

interface SurfData {
  waveHeight: number
  wavePeriod: number
  windSpeed: number
}

export default function Home() {
  const [surfData, setSurfData] = useState<SurfData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          🏄‍♂️ Nalu Surf
        </h1>
        
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
      </div>
    </div>
  )
}