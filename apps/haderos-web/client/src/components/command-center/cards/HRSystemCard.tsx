import { Users } from 'lucide-react';

interface HRData {
  total: number;
  present: number;
  late: number;
}

export function HRSystemCard() {
  const data: HRData = {
    total: 45,
    present: 42,
    late: 3,
  };

  const presentPercentage = (data.present / data.total) * 100;
  const latePercentage = (data.late / data.total) * 100;

  // Calculate stroke dasharray for donut chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const presentDash = (presentPercentage / 100) * circumference;
  const lateDash = (latePercentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/5 p-6">
      {/* Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">HR System</h3>
          <p className="text-xs text-gray-500">HADER System 07</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="16"
            />
            {/* Present (green) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#greenGradient)"
              strokeWidth="16"
              strokeDasharray={`${presentDash} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            {/* Late (yellow) - starts after present */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#EAB308"
              strokeWidth="16"
              strokeDasharray={`${lateDash} ${circumference}`}
              strokeDashoffset={-presentDash}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{data.total}</span>
            <span className="text-sm text-gray-400">Total</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Present</p>
          <p className="text-2xl font-bold text-emerald-400">{data.present}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Late</p>
          <p className="text-2xl font-bold text-yellow-400">{data.late}</p>
        </div>
      </div>
    </div>
  );
}
