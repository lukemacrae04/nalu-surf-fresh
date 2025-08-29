import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  console.log('=== SESSION SAVE DEBUG START ===')
  
  try {
    // Step 1: Create admin client using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('1. Created admin client with service role')

    // Step 2: Parse request data
    const requestData = await request.json()
    console.log('2. Received session data:', JSON.stringify(requestData, null, 2))

    // Step 3: Extract and validate data
    const {
      user_id,
      location,
      date, 
      board_used,
      rating,
      notes,
      duration_minutes,
      conditions,
      
      // Legacy fallback fields
      userId, 
      duration, 
      board, 
      conversation
    } = requestData

    const sessionUserId = user_id || userId
    console.log('3. User ID for session:', sessionUserId)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: 'User authentication required',
        debug: 'No user_id found in request'
      }, { status: 401 })
    }

    // Step 4: Process session data
    const sessionLocation = location || 'Byron Bay, Australia'
    const sessionBoard = board_used || board || 'Unknown board'
    const sessionRating = rating || parseInt(rating) || 5
    const sessionNotes = notes || (conversation ? `Logged via Kai: ${conversation.slice(0, 100)}...` : '')
    const sessionDate = date || new Date().toISOString().split('T')[0]
    
    let sessionDuration = duration_minutes || 60
    if (duration && !duration_minutes) {
      const hours = duration.match(/(\d+)\s*hours?/i)?.[1]
      const mins = duration.match(/(\d+)\s*min/i)?.[1]
      if (hours) sessionDuration = parseInt(hours) * 60
      else if (mins) sessionDuration = parseInt(mins)
    }

    const sessionConditions = typeof conditions === 'object' ? JSON.stringify(conditions) : (conditions || 'No conditions noted')

    const finalData = {
      user_id: sessionUserId,
      location: sessionLocation,
      date: sessionDate,
      board_used: sessionBoard,
      conditions: sessionConditions,
      rating: sessionRating,
      notes: sessionNotes,
      duration_minutes: sessionDuration
    }

    console.log('4. Final data for database:', JSON.stringify(finalData, null, 2))

    // Step 5: Database insert using admin client (bypasses RLS)
    console.log('5. Attempting database insert with admin client...')
    
    const { data, error } = await supabaseAdmin
      .from('surf_sessions')
      .insert([finalData])

    if (error) {
      console.log('6. Database error:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log('6. Database insert successful!')
    console.log('7. Inserted data:', JSON.stringify(data, null, 2))
    console.log('=== SESSION SAVE DEBUG END SUCCESS ===')

    return NextResponse.json({ 
      success: true,
      message: 'Session saved successfully!',
      debug: 'Session logged using admin client'
    })
    
  } catch (error) {
    console.log('=== SESSION SAVE DEBUG END ERROR ===')
    console.error('Complete error object:', JSON.stringify(error, null, 2))
    console.error('Error message:', error.message)
    
    return NextResponse.json({ 
      error: 'Failed to save session: ' + error.message,
      details: error.message,
      debug: 'Check server logs for complete error details'
    }, { status: 500 })
  }
}