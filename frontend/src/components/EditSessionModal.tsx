import { useEffect } from 'react';
import { useSessionStore, type Session } from '../store/sessionStore';
import SessionForm, { type SessionFormValues } from './SessionForm';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSessionModal({ session, onClose, onSuccess }: EditSessionModalProps) {
  const { updateSession, isLoading } = useSessionStore();
  const { user } = useAuthStore();
  const activeGroup = user?.groups?.find((g) => g.id === (session.group?.id ?? user?.groupId));
  const sportType = activeGroup?.sportType ?? 'PADEL';

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const court = session.courts?.[0];

  const handleSubmit = async (values: SessionFormValues) => {
    await updateSession(session.id, {
      date: values.date,
      time: values.startTime,
      venueName: values.venueName,
      notes: values.notes || undefined,
    });

    // Update court details if a court exists
    if (court) {
      const token = localStorage.getItem('token');
      const payload: any = {
        startTime: values.startTime,
        duration: values.duration,
        maxPlayers: values.maxPlayers,
      };
      if (values.cost !== '') payload.cost = values.cost;
      await fetch(`${API_URL}/api/courts/${court.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8">
        <SessionForm
          mode="edit"
          sportType={sportType}
          initialValues={{
            date: session.date.split('T')[0],
            startTime: court?.startTime ?? session.time,
            duration: court?.duration ?? 60,
            cost: court?.cost ? Number(court.cost) : '',
            venueName: session.venueName,
            notes: session.notes ?? '',
            maxPlayers: court?.maxPlayers ?? 4,
          }}
          onSubmit={handleSubmit}
          onClose={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
