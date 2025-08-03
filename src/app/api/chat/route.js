import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, conversationHistory, conditionsContext, userId } = await request.json()
    
    // Detect if user is asking about future conditions
    const forecastKeywords = /tomorrow|next|later|should i surf/i
    const isForecastRequest = forecastKeywords.test(message)
    
    let contextPrompt = ""
    
    if (isForecastRequest) {
      // Get tomorrow's forecast
      try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(8, 0, 0, 0) // 8am tomorrow
        
        const forecastResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/surf?lat=-28.644&lng=153.612&start=${tomorrow.toISOString()}`)
        const forecastData = await forecastResponse.json()
        
        if (forecastData.hours && forecastData.hours.length > 0) {
          const forecast = forecastData.hours[0] // Use first forecast point
          const waveHeight = forecast.waveHeight?.sg || 0
          const wavePeriod = forecast.wavePeriod?.sg || 0
          const windSpeed = forecast.windSpeed?.sg || 0
          
          contextPrompt = `Tomorrow morning's forecast for Byron Bay: ${waveHeight.toFixed(1)}m waves at ${wavePeriod.toFixed(0)}s with ${windSpeed.toFixed(0)}km/h wind.`
        } else {
          contextPrompt = "Tomorrow's forecast data unavailable."
        }
      } catch (error) {
        contextPrompt = "Tomorrow's forecast data unavailable."
      }
    } else {
      contextPrompt = conditionsContext ? `Current conditions: ${conditionsContext}` : ""
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are Kai, a helpful surf buddy from Byron Bay. Speak naturally and casually.

${contextPrompt}

User said: "${message}"

If you have forecast data above, structure your response as:
1. Start with the forecast: "Tomorrow morning's forecast: [numbers]"
2. Give ONE specific recommendation: spot + board + timing
3. Brief reason why (1 sentence)

If no forecast data, give general timing advice for Byron Bay spots.

Keep total response under 100 words. Be direct and helpful.`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      response: data.content[0].text 
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      response: `Tomorrow's forecast: Check The Pass around 9am with a mid-length board for the best conditions.`
    })
  }
}