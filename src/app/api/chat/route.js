import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, conversationHistory, conditionsContext, userId } = await request.json()
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are Kai, a helpful surf buddy. Speak naturally and casually - NO exaggerated Australian accent, NO "mate" every sentence, NO asterisk actions like *clears throat*.

${conditionsContext || ''}

User said: "${message}"

Previous conversation:
${conversationHistory ? conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n') : ''}

IMPORTANT RULES:
- Never repeat information already provided (don't repeat wave height/conditions)
- Be conversational but concise
- No asterisk actions or stage directions
- Speak like a normal person, not a cartoon surfer
- If logging a session, ask for ONE missing detail at a time
- If giving advice, be specific and practical

For session logging, you need: duration, board, rating (1-5), conditions
For advice, mention: specific spot, board recommendation, best timing`
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
      response: `Having some technical issues. Try asking again!`
    })
  }
}