import { useSocket } from '@/shared/lib/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}
