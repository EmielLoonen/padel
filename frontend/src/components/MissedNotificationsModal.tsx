import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';

interface MissedNotificationsModalProps {
  onClose: () => void;
  onNotificationClick?: (sessionId: string) => void;
}

export default function MissedNotificationsModal({ onClose, onNotificationClick }: MissedNotificationsModalProps) {
  const { missedNotifications, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    // Mark all missed notifications as read when modal is shown
    if (missedNotifications.length > 0) {
      markAllAsRead();
    }
  }, []);

  const handleNotificationClick = (sessionId?: string) => {
    if (sessionId && onNotificationClick) {
      onNotificationClick(sessionId);
    }
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (missedNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-card rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🔔</span>
              What You Missed
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {missedNotifications.length} new notification{missedNotifications.length === 1 ? '' : 's'} since your last login
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {missedNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.sessionId)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notification.sessionId
                    ? 'bg-dark-elevated border-gray-700 hover:border-padel-green hover:bg-dark-card'
                    : 'bg-dark-elevated border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getNotificationEmoji(notification.type)}</span>
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                    {notification.session && (
                      <div className="text-xs text-gray-400 mt-2">
                        <span className="text-padel-green">🎾</span> {notification.session.venueName} ·{' '}
                        {new Date(notification.session.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {notification.session.time}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-padel-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function getNotificationEmoji(type: string): string {
  switch (type) {
    case 'session_created':
      return '🎾';
    case 'rsvp_update':
      return '✅';
    case 'session_reminder':
      return '⏰';
    case 'session_updated':
      return '📝';
    case 'booking_update':
      return '📅';
    default:
      return '🔔';
  }
}

