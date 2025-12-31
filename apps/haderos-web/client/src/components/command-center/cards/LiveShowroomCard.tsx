import { Video, Eye, Play, Wifi } from "lucide-react";

interface LiveShowroomData {
  viewers: number;
  duration: string;
  isLive: boolean;
}

export function LiveShowroomCard() {
  const data: LiveShowroomData = {
    viewers: 1239,
    duration: "2:34:12",
    isLive: true,
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-red-500/20 p-6">
      {/* Live indicator glow */}
      {data.isLive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Live Showroom</h3>
            <p className="text-xs text-gray-500">System 01</p>
          </div>
        </div>
        {/* Live Badge */}
        {data.isLive && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-400">LIVE</span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      <div className="relative h-32 mb-4 rounded-xl bg-gradient-to-br from-red-900/30 to-pink-900/30 overflow-hidden group cursor-pointer">
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Streaming indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-xs text-gray-300">Streaming</span>
        </div>

        {/* Viewer count overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <Eye className="w-3 h-3 text-red-400" />
          <span className="text-xs font-medium text-white">{data.viewers.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Viewers</p>
          <p className="text-2xl font-bold text-red-400">{data.viewers.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Duration</p>
          <p className="text-2xl font-bold text-white">{data.duration}</p>
        </div>
      </div>
    </div>
  );
}
