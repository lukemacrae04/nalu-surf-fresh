import { NextResponse } from 'next/server'
import { supabase } from '../../../supabase'

export async function POST(request) {
  try {
    const { userId, duration, board, rating, conditions, conversation, location } = await request.json()

    // Better extraction from the full conversation
    const conversationText = conversation || ''
    
    // Extract duration in minutes
    let durationMinutes = 60 // default
    if (duration) {
      const hours = duration.match(/(\d+)\s*hours?/i)?.[1]
      const mins = duration.match(/(\d+)\s*min/i)?.[1]
      if (hours) durationMinutes = parseInt(hours) * 60
      else if (mins) durationMinutes = parseInt(mins)
    }

    // Extract actual board details
    const actualBoard = board || 'Unknown board'
    
    // Extract actual conditions
    const actualConditions = conditions || 'No conditions noted'

    // Use dynamic location or fallback
    const sessionLocation = location ? 
      `${location.name}, ${location.region}, ${location.state}` : 
      'Byron Bay, Australia'
    
    const spotId = location?.spotId || 'byron-bay'

    const { error } = await supabase
      .from('surf_sessions')
      .insert([
        {
          user_id: userId,
          location: sessionLocation,
          spot_id: spotId, // NEW: For better analytics and "gets smarter" features
          break_type: location?.breakType || 'Unknown', // NEW: Track break types
          coordinates: location?.coordinates ? `${location.coordinates.lat},${location.coordinates.lng}` : null, // NEW: For mapping
          date: new Date().toISOString().split('T')[0],
          board_used: actualBoard,
          conditions: actualConditions,
          rating: parseInt(rating) || 5,
          notes: `Logged via Kai: ${conversationText.slice(0, 100)}...`,
          duration_minutes: durationMinutes
        }
      ])

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      message: 'Session saved successfully!',
      location: sessionLocation,
      spotId: spotId
    })
  } catch (error) {
    console.error('Save session error:', error)
    return NextResponse.json({ 
      error: 'Failed to save session: ' + error.message 
    }, { status: 500 })
  }
}