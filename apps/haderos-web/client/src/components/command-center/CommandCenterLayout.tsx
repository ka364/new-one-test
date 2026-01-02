import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  LayoutGrid,
  Video,
  Users,
  Factory,
  Truck,
  Bot,
  Calendar,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { icon: LayoutGrid, label: 'Command Center', path: '/command-center', badge: 1 },
  { icon: Video, label: 'Live Showroom', sublabel: 'System 01', path: '/live-showroom' },
  { icon: Users, label: 'Affiliate Army', sublabel: 'System 02', path: '/affiliate-army' },
  { icon: Factory, label: 'Trader/Factory B2B', sublabel: 'System 03', path: '/trader-b2b' },
  { icon: Truck, label: 'Smart Shipping', sublabel: 'System 04', path: '/smart-shipping' },
  { icon: Bot, label: 'AI Agents', sublabel: 'DevLab & Guardian', path: '/ai-agents' },
  {
    icon: Calendar,
    label: 'Board Meeting & Strategy',
    sublabel: 'System 12',
    path: '/board-meeting',
  },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface CommandCenterLayoutProps {
  children: React.ReactNode;
}

export default function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
  const [location, setLocation] = useLocation();
  const [language, setLanguage] = useState<'AR' | 'EN'>('EN');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f0f18] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">HADEROS OS</h1>
              <span className="text-xs text-orange-500">v2.0</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              location === item.path || (item.path === '/command-center' && location === '/');
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30'
                    : 'hover:bg-white/5'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-white' : 'text-gray-300'
                      )}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  {item.sublabel && <span className="text-xs text-gray-500">{item.sublabel}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#0f0f18]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setLanguage('AR')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-all',
                  language === 'AR' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                AR
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-all',
                  language === 'EN' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                EN
              </button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-600 text-white text-sm">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">Admin</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1a1a24] border-white/10">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white cursor-pointer">
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button */}
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
