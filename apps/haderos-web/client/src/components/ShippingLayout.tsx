/**
 * HADER Shipping Dashboard Layout
 * Bosta-inspired design with HADER branding
 */

import { Link, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Package,
  TruckIcon,
  BarChart3,
  Settings,
  FileText,
  Users,
  DollarSign,
  Bell,
  LogOut,
  Home,
  PlusCircle,
  Search,
  ClipboardList,
} from 'lucide-react';

interface ShippingLayoutProps {
  children: React.ReactNode;
}

export function ShippingLayout({ children }: ShippingLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    {
      title: 'الرئيسية',
      items: [
        { name: 'لوحة التحكم', href: '/shipping', icon: Home },
        { name: 'إنشاء شحنة', href: '/shipping/create', icon: PlusCircle },
        { name: 'تتبع الشحنة', href: '/shipping/track', icon: Search },
      ],
    },
    {
      title: 'إدارة الشحنات',
      items: [
        { name: 'جميع الشحنات', href: '/shipping/shipments', icon: Package },
        { name: 'طلبات COD', href: '/shipping/cod-orders', icon: DollarSign },
        { name: 'سير العمل', href: '/shipping/workflow', icon: ClipboardList },
      ],
    },
    {
      title: 'التقارير',
      items: [
        { name: 'الأداء', href: '/shipping/performance', icon: BarChart3 },
        { name: 'التقارير', href: '/shipping/reports', icon: FileText },
      ],
    },
    {
      title: 'الإعدادات',
      items: [
        { name: 'الإعدادات', href: '/shipping/settings', icon: Settings },
        { name: 'المستخدمون', href: '/shipping/users', icon: Users },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/shipping') {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/shipping">
            <a className="flex items-center gap-3">
              <img 
                src="/brand/hader-logo-icon.png" 
                alt="HADER" 
                className="h-10 w-10"
              />
              <div>
                <div className="text-xl font-bold" style={{ color: '#C62822' }}>
                  HADER
                </div>
                <div className="text-xs text-gray-500">
                  Proudly Made in Egypt
                </div>
              </div>
            </a>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active 
                            ? 'bg-red-50 text-[#C62822]' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 right-0 w-full p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#C62822] to-[#156520] flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'مستخدم'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email || ''}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                نظام إدارة الشحن
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                مرحباً بك في نظام HADER لإدارة الشحنات
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Quick Actions */}
              <Link href="/shipping/create">
                <Button style={{ backgroundColor: '#C62822' }} className="text-white">
                  <PlusCircle className="h-4 w-4 ml-2" />
                  شحنة جديدة
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
