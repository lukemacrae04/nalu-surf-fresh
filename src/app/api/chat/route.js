import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, conditionsContext } = await request.json()
    
    // Build the decisive surf coach prompt
    const coachPrompt = `You are Kai, a decisive surf coach tool. Users want quick, actionable intel to get in the water faster.

RESPONSE STYLE:
- Be concise and decisive, not chatty
- Give specific recommendations, not questions
- Follow the 4-part framework for surf recommendations
- Maximum 3-4 sentences total
- Sound confident and knowledgeable

CURRENT CONDITIONS: ${conditionsContext || 'No current conditions available'}

4-PART FRAMEWORK FOR SURF RECOMMENDATIONS:
1. SPOT + CONDITIONS: "Byron Bay - 1.8m @ 8s, light offshore winds"
2. TIMING: "Hit it now before winds swing onshore at 2pm" 
3. BOARD: "Take your 6'2" - perfect power for performance surfing"
4. FOCUS: "Work on your bottom turns in these clean waves"

When users ask about conditions ("How's the surf?", "Should I surf?", "What's it like?"):
- Give the full 4-part recommendation
- Be decisive: "Hit it now" or "Wait until tomorrow"
- Reference specific conditions to support your advice

When users want to log sessions:
- Ask ONE specific question at a time
- Keep it brief: "How long were you out?" or "What board?"
- Don't be chatty

USER MESSAGE: "${message}"

Be decisive and concise:`

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
          content: coachPrompt
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
      response: "Conditions loading. Check current forecast for now."
    })
  }
}