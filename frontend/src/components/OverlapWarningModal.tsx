interface OverlapInfo {
  sessionId: string;
  sessionName: string;
  date: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
}

interface OverlapWarningModalProps {
  overlaps: OverlapInfo[];
  onProceed: () => void;
  onCancel: () => void;
}

export default function OverlapWarningModal({
  overlaps,
  onProceed,
  onCancel,
}: OverlapWarningModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl p-6 max-w-md w-full border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">⚠️</div>
          <h3 className="text-2xl font-bold text-white">Time Overlap Warning</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            You're about to join a session that overlaps in time with another session you've already confirmed:
          </p>

          <div className="space-y-3">
            {overlaps.map((overlap, index) => (
              <div
                key={overlap.sessionId}
                className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-400 mb-1">
                      {overlap.sessionName}
                    </p>
                    <p className="text-sm text-gray-300">
                      {formatDate(overlap.date)}
                    </p>
                    <p className="text-sm text-gray-300">
                      Court {overlap.courtNumber} · {formatTime(overlap.startTime)} - {formatTime(overlap.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-sm mt-4">
            You won't be able to attend both sessions at the same time. Do you want to proceed anyway?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Do not proceed
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
