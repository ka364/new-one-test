import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Lock, Unlock, RefreshCw, Trash2 } from 'lucide-react';

interface SecurityStats {
    totalLoginAttempts: number;
    failedAttempts: number;
    lockedAccounts: number;
    blockedIPs: number;
    recentAttempts: any[];
}

interface BlockedAccount {
    username: string;
    reason: string;
    blockedAt: string;
    unblockAt: string;
    remainingTime: number;
}

interface BlockedIP {
    ip: string;
    reason: string;
    blockedAt: string;
    unblockAt: string;
    remainingTime: number;
}

export const SecurityDashboard: React.FC = () => {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [blockedUsers, setBlockedUsers] = useState<BlockedAccount[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ips'>('overview');

    // Use Vite dev server proxy: '/api' will forward to backend at 127.0.0.1:8003
    // Full path becomes '/api/v1/security'
    const API_URL = '/api/v1/security';

    // Load data from server
    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, ipsRes] = await Promise.all([
                axios.get(`${API_URL}/stats`),
                axios.get(`${API_URL}/blocked-users`),
                axios.get(`${API_URL}/blocked-ips`),
            ]);

            setStats(statsRes.data.stats);
            setBlockedUsers(usersRes.data.blocked);
            setBlockedIPs(ipsRes.data.blocked);
        } catch (error) {
            console.error('خطأ في تحميل بيانات الأمان:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 10 seconds
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Unlock user
    const handleUnlockUser = async (username: string) => {
        try {
            await axios.post(`${API_URL}/unlock-user/${username}`);
            loadData();
        } catch (error) {
            console.error('خطأ في فك الحظر:', error);
        }
    };

    // Unblock IP
    const handleUnblockIP = async (ip: string) => {
        try {
            await axios.post(`${API_URL}/unblock-ip/${ip}`);
            loadData();
        } catch (error) {
            console.error('خطأ في فك الحظر:', error);
        }
    };

    // Clear all (test only)
    const handleClearAll = async () => {
        if (
            window.confirm(
                '⚠️ هل تريد مسح جميع بيانات الأمان؟ هذا للاختبار فقط!'
            )
        ) {
            try {
                await axios.post(`${API_URL}/clear-all`);
                loadData();
            } catch (error) {
                console.error('خطأ في المسح:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-lg text-gray-600">جاري تحميل بيانات الأمان...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Lock className="w-8 h-8 text-blue-600" />
                        لوحة تحكم الأمان
                    </h1>
                    <p className="text-gray-600 mt-2">
                        مراقبة محاولات التسجيل والحسابات المحظورة
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    {(
                        [
                            { id: 'overview' as const, label: '📊 نظرة عامة' },
                            { id: 'users' as const, label: '👥 الحسابات المحظورة' },
                            { id: 'ips' as const, label: '🔒 IP المحظورة' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="text-gray-600 text-sm font-semibold">
                                    إجمالي المحاولات
                                </div>
                                <div className="text-3xl font-bold text-blue-600 mt-2">
                                    {stats.totalLoginAttempts}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="text-gray-600 text-sm font-semibold">
                                    محاولات فاشلة
                                </div>
                                <div className="text-3xl font-bold text-red-600 mt-2">
                                    {stats.failedAttempts}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="text-gray-600 text-sm font-semibold">
                                    حسابات محظورة
                                </div>
                                <div className="text-3xl font-bold text-orange-600 mt-2">
                                    {stats.lockedAccounts}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="text-gray-600 text-sm font-semibold">
                                    IP محظورة
                                </div>
                                <div className="text-3xl font-bold text-purple-600 mt-2">
                                    {stats.blockedIPs}
                                </div>
                            </div>
                        </div>

                        {/* Recent Attempts */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                آخر المحاولات
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {stats.recentAttempts.length > 0 ? (
                                    stats.recentAttempts.slice(0, 20).map((attempt, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded border-l-4 ${attempt.success
                                                ? 'bg-green-50 border-green-500'
                                                : 'bg-red-50 border-red-500'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-gray-900">
                                                        {attempt.username}
                                                    </span>
                                                    <span
                                                        className={`ml-3 text-sm ${attempt.success
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                            }`}
                                                    >
                                                        {attempt.success ? '✓ ناجح' : '✗ فاشل'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {attempt.ip}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(attempt.timestamp).toLocaleString('ar-SA')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        لا توجد محاولات تسجيل دخول
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            الحسابات المحظورة
                        </h3>
                        {blockedUsers.length > 0 ? (
                            <div className="space-y-3">
                                {blockedUsers.map((user) => (
                                    <div
                                        key={user.username}
                                        className="p-4 border border-red-200 rounded-lg bg-red-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                    <span className="font-bold text-gray-900">
                                                        {user.username}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    السبب: {user.reason}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    محظور منذ:{' '}
                                                    {new Date(user.blockedAt).toLocaleString('ar-SA')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    سيتم فك الحظر في:{' '}
                                                    {new Date(user.unblockAt).toLocaleString('ar-SA')}
                                                </p>
                                                <p className="text-xs font-semibold text-red-600 mt-1">
                                                    الوقت المتبقي:{' '}
                                                    {Math.ceil(user.remainingTime / 1000 / 60)}د
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnlockUser(user.username)}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <Unlock className="w-4 h-4" />
                                                فك الحظر
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                لا توجد حسابات محظورة
                            </p>
                        )}
                    </div>
                )}

                {/* IPs Tab */}
                {activeTab === 'ips' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            عناوين IP المحظورة
                        </h3>
                        {blockedIPs.length > 0 ? (
                            <div className="space-y-3">
                                {blockedIPs.map((ip) => (
                                    <div
                                        key={ip.ip}
                                        className="p-4 border border-purple-200 rounded-lg bg-purple-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-purple-600" />
                                                    <code className="font-bold text-gray-900 bg-gray-200 px-2 py-1 rounded">
                                                        {ip.ip}
                                                    </code>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    السبب: {ip.reason}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    محظور منذ:{' '}
                                                    {new Date(ip.blockedAt).toLocaleString('ar-SA')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    سيتم فك الحظر في:{' '}
                                                    {new Date(ip.unblockAt).toLocaleString('ar-SA')}
                                                </p>
                                                <p className="text-xs font-semibold text-purple-600 mt-1">
                                                    الوقت المتبقي:{' '}
                                                    {Math.ceil(ip.remainingTime / 1000 / 60)}د
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnblockIP(ip.ip)}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <Unlock className="w-4 h-4" />
                                                فك الحظر
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                لا توجد عناوين IP محظورة
                            </p>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        تحديث البيانات
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        مسح الكل (للاختبار فقط)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecurityDashboard;
