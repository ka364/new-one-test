import { useEffect, useState } from 'react';
import { checkBackendConnection, getBackendUrl } from '@/lib/backend-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    const isConnected = await checkBackendConnection();
    setStatus(isConnected ? 'connected' : 'disconnected');
    setLastCheck(new Date());
  };

  useEffect(() => {
    // Check on mount
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: {
      icon: Loader2,
      iconClass: 'animate-spin text-blue-500',
      badge: 'جاري الفحص...',
      badgeVariant: 'secondary' as const,
      message: 'Checking backend connection...',
    },
    connected: {
      icon: CheckCircle2,
      iconClass: 'text-green-500',
      badge: 'متصل',
      badgeVariant: 'default' as const,
      message: 'Backend connected',
    },
    disconnected: {
      icon: XCircle,
      iconClass: 'text-red-500',
      badge: 'غير متصل',
      badgeVariant: 'destructive' as const,
      message: 'Backend not reachable',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Backend Status</span>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.badge}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{getBackendUrl()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconClass}`} />
            {lastCheck && (
              <span className="text-xs text-muted-foreground">
                {lastCheck.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        {status === 'disconnected' && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-700 dark:text-red-400">
            ⚠️ Cannot connect to haderos-platform backend. Make sure it's running at{' '}
            {getBackendUrl()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
