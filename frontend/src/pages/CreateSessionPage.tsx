import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import SessionForm, { type SessionFormValues } from '../components/SessionForm';

export default function CreateSessionPage({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const activeGroup = user?.groups?.find((g) => g.id === user.groupId);
  const sportType = activeGroup?.sportType ?? 'PADEL';

  const { createSession, isLoading, error } = useSessionStore();

  const handleSubmit = async (values: SessionFormValues) => {
    await createSession({
      date: values.date,
      time: values.startTime,
      venueName: values.venueName,
      notes: values.notes || undefined,
      courts: [{ courtNumber: 1, startTime: values.startTime, duration: values.duration, cost: values.cost || undefined, maxPlayers: values.maxPlayers }],
    });

    alert('Session created successfully! 🎾');
    onSuccess?.();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SessionForm
        mode="create"
        sportType={sportType}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
