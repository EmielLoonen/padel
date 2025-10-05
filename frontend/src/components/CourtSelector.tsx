import { useEffect } from 'react';
import { type Court } from '../store/sessionStore';

interface CourtSelectorProps {
  courts: Court[];
  selectedCourtId: string | null | undefined;
  onSelectCourt: (courtId: string | null) => void;
  disabled?: boolean;
}

export default function CourtSelector({
  courts,
  selectedCourtId,
  onSelectCourt,
  disabled = false,
}: CourtSelectorProps) {
  // If only one court, auto-select it
  useEffect(() => {
    if (courts.length === 1 && !disabled && !selectedCourtId) {
      const court = courts[0];
      onSelectCourt(court.id);
    }
  }, [courts.length, disabled, selectedCourtId, courts, onSelectCourt]);

  if (courts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <p>No courts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">Select Your Court:</h4>
      
      {courts.map((court) => {
        const isSelected = selectedCourtId === court.id;
        const isFull = court.isFull || (court.rsvps && court.rsvps.length >= court.maxPlayers);
        const availableSpots =
          court.availableSpots !== undefined
            ? court.availableSpots
            : court.maxPlayers - (court.rsvps?.length || 0);

        return (
          <button
            key={court.id}
            type="button"
            onClick={() => !disabled && !isFull && onSelectCourt(court.id)}
            disabled={disabled || isFull}
            className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? 'bg-padel-green/20 border-padel-green'
                : isFull
                ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                : 'bg-[#242424] border-gray-700 hover:border-padel-green hover:bg-[#2a2a2a]'
            }`}
          >
            {/* Mobile: Stack layout, Desktop: Row layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                {/* Header with badges */}
                <div className="flex items-center justify-between sm:justify-start gap-2 mb-2">
                  <span className="text-base sm:text-lg font-bold text-white">
                    Court {court.courtNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="bg-padel-green text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        Selected
                      </span>
                    )}
                    {isFull && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        Full
                      </span>
                    )}
                    {/* Mobile emoji - only show if not selected */}
                    {!isSelected && (
                      <span className="text-xl sm:hidden">
                        {isFull ? '🔒' : '🎾'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs sm:text-sm text-gray-400 space-y-1">
                  <p>
                    🕐 {court.startTime} ({court.duration} min)
                  </p>
                  <p className={availableSpots === 0 ? 'text-red-400' : 'text-padel-green'}>
                    {availableSpots}/{court.maxPlayers} spots available
                  </p>
                </div>

                {/* Show players on this court - Mobile: vertical, Desktop: wrap */}
                {court.rsvps && court.rsvps.length > 0 && (
                  <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-1">
                    {court.rsvps.map((rsvp) => (
                      <span
                        key={rsvp.id}
                        className="inline-block bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/30"
                      >
                        {rsvp.user.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop emoji - only show if not selected */}
              {!isSelected && (
                <div className="hidden sm:block text-2xl ml-3">
                  {isFull ? '🔒' : '🎾'}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Waitlist option - only show if all courts are full AND user is not already assigned to a court */}
      {courts.every((c) => c.isFull || (c.rsvps && c.rsvps.length >= c.maxPlayers)) && 
       !selectedCourtId && (
        <button
          type="button"
          onClick={() => !disabled && onSelectCourt(null)}
          disabled={disabled}
          className="w-full p-4 rounded-xl border-2 bg-[#242424] border-gray-700 hover:border-yellow-500 hover:bg-[#2a2a2a] transition-all text-left"
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold text-white">Join Waitlist</span>
              <p className="text-sm text-gray-400 mt-1">
                All courts are full - you'll be notified if a spot opens up
              </p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </button>
      )}
    </div>
  );
}

