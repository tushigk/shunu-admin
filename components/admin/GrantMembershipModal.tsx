"use client";

import React, { useState } from 'react';
import { X, Loader2, Save, Search, User as UserIcon, CreditCard, Calendar } from 'lucide-react';
import { membershipApi, userApi } from '@/apis';
import useSWR from 'swr';
import { User } from '@/components/providers/AuthProvider';

interface MembershipPlan {
    _id: string;
    title: string;
    months: number;
}

interface GrantMembershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GrantMembershipModal({ isOpen, onClose, onSuccess }: GrantMembershipModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [customExpiry, setCustomExpiry] = useState('');
    const [note, setNote] = useState('');
    const [isComplimentary, setIsComplimentary] = useState(false);

    const { data: usersData, isLoading: searching } = useSWR(
        userSearch.length >= 3 ? ['users', 1, userSearch] : null,
        () => userApi.getUsers({ page: 1, search: userSearch })
    );

    const { data: plansData } = useSWR('membership-plans-short', () =>
        membershipApi.adminListMembershipPlans()
    );

    const users = usersData?.users || [];
    const plans = plansData?.data || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Please select a user');
            return;
        }
        if (!selectedPlanId) {
            alert('Please select a plan');
            return;
        }

        setSubmitting(true);
        try {
            await membershipApi.adminGrantMembership({
                userId: selectedUser._id,
                planId: selectedPlanId,
                expiresAt: customExpiry || undefined,
                note: note || undefined,
                isComplimentary: isComplimentary,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to grant membership:', error);
            alert('Failed to grant membership');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Grant Access</h2>
                        <p className="text-sm text-gray-500 mt-1">Manually assign a membership plan to a user</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    <form id="grant-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* User Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Find User</label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{selectedUser.name || selectedUser.username || 'No Name'}</p>
                                            <p className="text-xs text-blue-400/70">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-xs font-bold text-blue-400 hover:text-white underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Type name or email (min 3 chars)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                    {searching && (
                                        <div className="absolute inset-y-0 right-4 flex items-center">
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                    {users.length > 0 && userSearch.length >= 3 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
                                            {users.slice(0, 5).map((u: User) => (
                                                <button
                                                    key={u._id}
                                                    type="button"
                                                    onClick={() => setSelectedUser(u)}
                                                    className="w-full px-5 py-3 flex flex-col items-start hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <span className="font-bold text-white text-sm">{u.name || u.username || 'No Name'}</span>
                                                    <span className="text-xs text-gray-500">{u.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Plan Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Select Plan</label>
                            <div className="grid grid-cols-1 gap-3">
                                {plans.map((plan: MembershipPlan) => (
                                    <button
                                        key={plan._id}
                                        type="button"
                                        onClick={() => setSelectedPlanId(plan._id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedPlanId === plan._id
                                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className={`w-5 h-5 ${selectedPlanId === plan._id ? 'text-blue-400' : 'text-gray-500'}`} />
                                            <span className={`font-bold text-sm ${selectedPlanId === plan._id ? 'text-white' : 'text-gray-400'}`}>
                                                {plan.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{plan.months} Months</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Expiry */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold text-gray-400">Custom Expiry (Optional)</label>
                                <span className="text-[10px] text-gray-600 italic">Defaults to plan duration</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                    value={customExpiry}
                                    onChange={(e) => setCustomExpiry(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Note (Optional)</label>
                            <textarea
                                placeholder="Reason for granting membership..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        {/* Revenue Toggle */}
                        <div className="flex items-center gap-3 px-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isComplimentary}
                                    onChange={(e) => setIsComplimentary(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-semibold text-gray-400">Exclude from revenue statistics</span>
                            </label>
                            <p className="text-[10px] text-gray-600 italic mt-0.5">(Gift/Manual grant without payment)</p>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/10 bg-white/2 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="grant-form"
                        type="submit"
                        disabled={submitting || !selectedUser || !selectedPlanId}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Granting...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Grant Membership</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
