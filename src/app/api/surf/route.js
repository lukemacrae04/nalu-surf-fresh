import { NextResponse } from 'next/server'
import cacheManager from '../cache-manager.js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || '-28.644' // Byron Bay default
  const lng = searchParams.get('lng') || '153.612'
  const start = searchParams.get('start') // For forecast requests
  
  const cacheType = start ? 'forecast' : 'current'
  
  // Check cache first
  const cachedData = cacheManager.get(lat, lng, cacheType)
  if (cachedData) {
    return NextResponse.json(cachedData)
  }
  
  // Build Stormglass URL
  let stormglassUrl = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=waveHeight,wavePeriod,waveDirection,windSpeed,windDirection&source=sg`
  
  if (start) {
    // If requesting forecast, get next 24 hours from specified start time
    const startTime = new Date(start).toISOString()
    const endTime = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString()
    stormglassUrl += `&start=${startTime}&end=${endTime}`
  }
  
  try {
    console.log(`🌊 Making Stormglass API call for ${cacheType} (${lat}, ${lng})`)
    
    const response = await fetch(stormglassUrl, {
      headers: {
        'Authorization': process.env.STORMGLASS_API_KEY
      }
    })
    
    if (!response.ok) {
      throw new Error(`Stormglass API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Cache the successful response
    cacheManager.set(lat, lng, data, cacheType)
    
    console.log(`✅ Stormglass API success - cached for ${cacheType === 'forecast' ? '6' : '3'} hours`)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Stormglass API error:', error)
    
    // Return mock data if API fails
    const mockData = {
      hours: [{
        time: new Date().toISOString(),
        waveHeight: { sg: 1.5 },
        wavePeriod: { sg: 8 },
        windSpeed: { sg: 10 }
      }]
    }
    
    return NextResponse.json(mockData)
  }
}