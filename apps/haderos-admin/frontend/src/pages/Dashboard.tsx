import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        useAuthStore.getState().loadFromStorage();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        logout();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Header */}
            <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">HaderOS Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-white">
                            <p className="text-sm opacity-75">Logged in as</p>
                            <p className="font-semibold">{user.username}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-500/50 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Welcome, {user.full_name || user.username}!
                    </h2>
                    <p className="text-gray-300">
                        You are logged in as <span className="font-semibold capitalize">{user.role}</span>
                    </p>
                </div>

                {/* User Info Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-6">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-400 text-sm">Username</p>
                            <p className="text-white font-semibold">{user.username}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Email</p>
                            <p className="text-white font-semibold">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Role</p>
                            <p className="text-white font-semibold capitalize">{user.role}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">ID</p>
                            <p className="text-white font-semibold">{user.id}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Access */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {[
                        { title: 'Bio Modules', description: 'Manage bio-inspired modules' },
                        { title: 'Compliance', description: 'Sharia compliance tools' },
                        { title: 'Blockchain', description: 'Blockchain management' },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-blue-400/50 transition cursor-pointer"
                        >
                            <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
