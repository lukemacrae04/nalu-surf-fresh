'use client';

import { useState } from 'react';
import { Star, X, Plus, Minus } from 'lucide-react';

export default function SessionModal({ 
  isOpen, 
  onClose, 
  currentSpot, 
  forecastData,
  chatContext 
}) {
  // Debug: Check what forecast data we're receiving
  console.log('SessionModal - forecastData:', forecastData);
  console.log('SessionModal - currentSpot:', currentSpot);
  // Smart pre-filling from chat context and forecast
  const [duration, setDuration] = useState(1.5);
  const [board, setBoard] = useState("6'2\" Shortboard");
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

    setIsSaving(true);
    
    try {
      const sessionData = {
        spot_name: currentSpot?.name || 'Unknown Location',
        spot_id: currentSpot?.id,
        break_type: currentSpot?.breakType,
        latitude: currentSpot?.lat,
        longitude: currentSpot?.lng,
        duration_hours: duration,
        board_used: board,
        session_rating: rating,
        wave_size_vs_forecast: waveSize,
        wind_vs_forecast: wind,
        wave_quality_vs_forecast: waveQuality,
        additional_notes: notes,
        session_date: new Date().toISOString()
      };

      const response = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        onClose();
        // Success feedback is handled by parent component
      } else {
        console.error('Failed to save session');
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              How was your session?
            </h2>
            <p className="text-sm text-gray-600">
              {currentSpot?.name || 'Current Location'} • {sessionTime} session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleDurationChange(-0.5)}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg min-w-[6rem] text-center">
                <span className="text-lg font-medium text-gray-900">
                  {duration} hours
                </span>
              </div>
              <button
                onClick={() => handleDurationChange(0.5)}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Board */}
          <div className="mb-6">
            <label htmlFor="board-select" className="block text-sm font-medium text-gray-700 mb-2">
              Board
            </label>
            <div className="relative">
              <select
                id="board-select"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none pr-10"
              >
                {boardOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {/* Custom chevron icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => handleStarClick(index)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      index < rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Wave Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wave Size {forecastData?.waveHeight ? `(Forecast: ${forecastData.waveHeight.toFixed(1)}m)` : ''}
            </label>
            <div className="flex space-x-2">
              {['Bigger', 'Same', 'Smaller'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('wave', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium ${
                    waveSize === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Wind */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wind {forecastData?.windSpeed ? `(Forecast: ${forecastData.windSpeed.toFixed(0)}km/h ${formatWindDirection(forecastData.windDirection)})` : ''}
            </label>
            <div className="flex flex-wrap gap-2">
              {['Lighter', 'Same', 'Stronger', 'Different direction'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('wind', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium ${
                    wind === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Wave Quality */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wave Quality (Forecast: Clean)
            </label>
            <div className="flex space-x-2">
              {['Better', 'Same', 'Worse'].map(option => (
                <button
                  key={option}
                  onClick={() => handleConditionClick('quality', option)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium ${
                    waveQuality === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label htmlFor="session-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else worth noting?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={rating === 0 || isSaving}
              className={`flex-1 py-3 px-4 font-medium rounded-lg ${
                rating === 0 || isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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