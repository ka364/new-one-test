import { CheckCircle, Activity, Server, Database, Wifi, Shield } from 'lucide-react';

interface SystemStatus {
  name: string;
  icon: React.ElementType;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

export function SystemStatusCard() {
  const systems: SystemStatus[] = [
    { name: 'API Gateway', icon: Server, status: 'operational', uptime: '99.99%' },
    { name: 'Database', icon: Database, status: 'operational', uptime: '99.95%' },
    { name: 'CDN', icon: Wifi, status: 'operational', uptime: '100%' },
    { name: 'Auth Service', icon: Shield, status: 'operational', uptime: '99.99%' },
    { name: 'AI Services', icon: Activity, status: 'operational', uptime: '99.90%' },
  ];

  const allOperational = systems.every((s) => s.status === 'operational');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-900/20 via-[#1a1a24] to-[#12121a] border border-cyan-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allOperational ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}
          >
            <Activity
              className={`w-5 h-5 ${allOperational ? 'text-green-400' : 'text-yellow-400'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">System Status</h3>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Mobile App Preview Button */}
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <span className="text-lg">📱</span>
          Customer Mobile App Preview
        </button>
      </div>

      {/* System Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {systems.map((system) => (
          <div
            key={system.name}
            className="bg-white/5 rounded-xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors"
          >
            <div
              className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center ${
                system.status === 'operational'
                  ? 'bg-green-500/20'
                  : system.status === 'degraded'
                    ? 'bg-yellow-500/20'
                    : 'bg-red-500/20'
              }`}
            >
              <system.icon
                className={`w-5 h-5 ${
                  system.status === 'operational'
                    ? 'text-green-400'
                    : system.status === 'degraded'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              />
            </div>
            <p className="text-sm font-medium text-white mb-1">{system.name}</p>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  system.status === 'operational'
                    ? 'bg-green-400'
                    : system.status === 'degraded'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                }`}
              />
              <span className="text-xs text-gray-400">{system.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
