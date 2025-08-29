'use client';

import { useState } from 'react';
import { Star, X, Plus, Minus } from 'lucide-react';

export default function SessionModal({ 
  isOpen, 
  onClose, 
  currentSpot, 
  forecastData,
  chatContext,
  userId  // FIXED: Added userId prop
}) {
  // Smart pre-filling from chat context and forecast
  const [duration, setDuration] = useState(1.5);
  const [board, setBoard] = useState("6'2\" Shortboard"); // Default selection
  const [rating, setRating] = useState(0);
  const [waveSize, setWaveSize] = useState('');
  const [wind, setWind] = useState('');
  const [waveQuality, setWaveQuality] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Board options - TODO: Replace with user's actual quiver from onboarding
  // This serves as MVP placeholder until user profile system is built
  const boardOptions = [
    "6'2\" Shortboard",
    "6'6\" Funboard", 
    "7'2\" Minimal",
    "8'6\" Longboard",
    "9'2\" Longboard"
  ];

  // Format wind direction for forecast display
  const formatWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  // Get session time and location for header
  const sessionTime = new Date().toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const handleDurationChange = (increment) => {
    const newDuration = Math.max(0.5, duration + increment);
    setDuration(Math.round(newDuration * 2) / 2); // Round to nearest 0.5
  };

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1);
  };

  const handleConditionClick = (type, value) => {
    switch(type) {
      case 'wave':
        setWaveSize(waveSize === value ? '' : value);
        break;
      case 'wind':
        setWind(wind === value ? '' : value);
        break;
      case 'quality':
        setWaveQuality(waveQuality === value ? '' : value);
        break;
    }
  };

  const handleSave = async () => {
    if (rating === 0) return; // Require rating
    if (!userId) {
      console.error('No userId provided - session cannot be saved');
      return;
    }

    setIsSaving(true);
    
    try {
      const sessionData = {
        user_id: userId, // FIXED: Added userId from prop
        location: currentSpot?.name || 'Unknown Location',
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        board_used: board,
        rating: rating,
        notes: notes || '',
        duration_minutes: Math.round(duration * 60), // Convert hours to minutes
        conditions: {
          wave_size_vs_forecast: waveSize,
          wind_vs_forecast: wind,
          wave_quality_vs_forecast: waveQuality,
          forecast_data: forecastData
        }
      };

      const response = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        onClose();
        // Session saved successfully - return to chat interface
      } else {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        console.error('Response Status:', response.status);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - subtle darkening that maintains app continuity */}
      <div 
        className="fixed inset-0 bg-slate-900/40 z-40"
        onClick={onClose}
      />
      
      {/* Modal - Deep Sea Blue theme integration */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-600 rounded-t-xl z-50 flex flex-col" style={{ height: '80vh', maxHeight: '600px' }}>
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              How was your session?
            </h2>
            <p className="text-sm text-slate-300">
              {currentSpot?.name || 'Current Location'} • {sessionTime} session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable middle section */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Duration
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleDurationChange(-0.5)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors duration-200"
              >
                <Minus className="w-4 h-4 text-slate-300" />
              </button>
              <div className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg min-w-[6rem] text-center">
                <span className="text-lg font-medium text-white">
                  {duration} hours
                </span>
              </div>
              <button
                onClick={() => handleDurationChange(0.5)}
                className="w-10 h-10 rounded-full border border-slate-600 bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors duration-200"
              >
                <Plus className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Board */}
          <div className="mb-6">
            <label htmlFor="board-select" className="block text-sm font-semibold text-white mb-2">
              Board
            </label>
            <div className="relative">
              <select
                id="board-select"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-3 border border-slate-600 bg-slate-700 rounded-lg appearance-none pr-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {boardOptions.map(option => (
                  <option key={option} value={option} className="bg-slate-700 text-white">{option}</option>
                ))}
              </select>
              {/* Custom chevron icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => handleStarClick(index)}
                  className="p-1 transition-colors duration-200"
                >
                  <Star
                    className={`w-8 h-8 ${
                      index < rating 
                        ? 'text-blue-400 fill-blue-400' 
                        : 'text-slate-600 hover:text-slate-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Wave Size */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-1">
              Wave Size
            </label>
            <p className="text-xs text-slate-400 mb-3">
              {forecastData?.waveHeight > 0 ? `Forecast: ${forecastData.waveHeight.toFixed(1)}m` : 'Forecast: No data'}
            </p>
            <div className="flex space-x-2">
              {['Bigger', 'Same', 'Smaller'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('wave', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                    waveSize === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Wind */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-1">
              Wind
            </label>
            <p className="text-xs text-slate-400 mb-3">
              {forecastData?.windSpeed > 0 ? `Forecast: ${forecastData.windSpeed.toFixed(0)}km/h ${formatWindDirection(forecastData.windDirection)}` : 'Forecast: No data'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['Lighter', 'Same', 'Stronger', 'Different direction'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('wind', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                    wind === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Wave Quality */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-1">
              Wave Quality
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Forecast: Clean
            </p>
            <div className="flex space-x-2">
              {['Better', 'Same', 'Worse'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('quality', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                    waveQuality === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label htmlFor="session-notes" className="block text-sm font-semibold text-white mb-1">
              Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Any other details worth remembering?
            </p>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={(e) => {
                // Scroll the textarea into view when focused on mobile
                setTimeout(() => {
                  e.target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }, 300); // Delay to let keyboard animate in
              }}
              placeholder="Anything else worth noting?"
              className="w-full p-3 border border-slate-600 bg-slate-700 rounded-lg resize-none text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t border-slate-600 p-4 bg-slate-800 flex-shrink-0">
          <div className="flex space-x-3 pb-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 text-slate-300 font-medium rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={rating === 0 || isSaving || !userId}
              className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors duration-200 ${
                rating === 0 || isSaving || !userId
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}