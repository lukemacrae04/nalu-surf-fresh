import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') || '-28.644'
  const lng = searchParams.get('lng') || '153.612'
  
  const stormglassUrl = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=waveHeight,wavePeriod,waveDirection,windSpeed,windDirection&source=sg`
  
  try {
    console.log('API Key:', process.env.STORMGLASS_API_KEY)
    const response = await fetch(stormglassUrl, {
      headers: {
        'Authorization': process.env.STORMGLASS_API_KEY
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surf data' }, { status: 500 })
  }
}