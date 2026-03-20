"use client";

import React from 'react';
import { Search, Bell, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <header className="h-20 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-400" />
                </button>

                {/* Search Bar - hidden on very small screens, visible on md+ */}
                <div className="flex-1 max-w-md hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search dashboard..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-6">
                <button className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group">
                    <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0c]" />
                </button>

                <div className="h-8 w-px bg-white/10 mx-1 sm:mx-2 hidden md:block" />

                <div className="flex items-center gap-2 sm:gap-4">
                    <button className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white hidden sm:block">Profile</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all group"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:block">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
