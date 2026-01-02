import { Truck, MapPin } from 'lucide-react';

interface ShippingData {
  activeTrucks: number;
  deliveries: number;
  locations: { x: number; y: number; status: 'active' | 'pending' | 'completed' }[];
}

export function SmartShippingCard() {
  const data: ShippingData = {
    activeTrucks: 8,
    deliveries: 24,
    locations: [
      { x: 30, y: 40, status: 'active' },
      { x: 50, y: 50, status: 'active' },
      { x: 70, y: 35, status: 'pending' },
      { x: 45, y: 65, status: 'completed' },
      { x: 60, y: 55, status: 'active' },
      { x: 35, y: 55, status: 'pending' },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#A855F7'; // Purple
      case 'pending':
        return '#3B82F6'; // Blue
      case 'completed':
        return '#10B981'; // Green
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-orange-500/20 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Truck className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Smart Shipping</h3>
          <p className="text-xs text-gray-500">Logistics System 04</p>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative h-32 mb-4 rounded-xl bg-purple-900/20 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Location markers */}
        <svg className="absolute inset-0 w-full h-full">
          {data.locations.map((loc, idx) => (
            <g key={idx}>
              {/* Pulse animation */}
              <circle
                cx={`${loc.x}%`}
                cy={`${loc.y}%`}
                r="8"
                fill={getStatusColor(loc.status)}
                opacity="0.3"
                className="animate-ping"
              />
              {/* Main dot */}
              <circle cx={`${loc.x}%`} cy={`${loc.y}%`} r="4" fill={getStatusColor(loc.status)} />
            </g>
          ))}
          {/* Connection lines */}
          <path
            d={`M ${data.locations[0].x}% ${data.locations[0].y}%
                Q ${data.locations[1].x}% ${data.locations[1].y}%
                  ${data.locations[2].x}% ${data.locations[2].y}%`}
            stroke="rgba(168, 85, 247, 0.3)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center border border-purple-500/50">
            <MapPin className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-orange-400">
            {data.activeTrucks} <span className="text-sm font-normal text-gray-500">Trucks</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Deliveries</p>
          <p className="text-2xl font-bold text-white">{data.deliveries}</p>
        </div>
      </div>
    </div>
  );
}
