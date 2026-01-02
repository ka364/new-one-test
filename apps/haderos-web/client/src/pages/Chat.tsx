import { useAuth } from '@/_core/hooks/useAuth';
import ChatInterface from '@/components/ChatInterface';

export default function Chat() {
  const { user } = useAuth();

  // Determine user role (worker or manager)
  const userRole = user?.role === 'admin' ? 'manager' : 'worker';

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface userRole={userRole} />
    </div>
  );
}
