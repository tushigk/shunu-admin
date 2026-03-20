"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { membershipApi } from '@/apis';
import MembershipPlanModal from '@/components/admin/MembershipPlanModal';
import {
    Plus,
    Search,
    Loader2,
    CreditCard,
    Users,
    DollarSign,
    Calendar,
    Edit2,
    Trash2,
    ShieldCheck,
    TrendingUp,
    MoreVertical
} from 'lucide-react';
import GrantMembershipModal from '@/components/admin/GrantMembershipModal';

interface MembershipPlan {
    _id: string;
    title: string;
    description?: string;
    months: number;
    price: number;
    isActive: boolean;
    sortOrder: number;
    image?: {
        _id: string;
        url: string;
    };
    createdAt: string;
}

interface User {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
}

interface Membership {
    _id: string;
    user: User;
    plan: MembershipPlan;
    planTitle: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    isActive: boolean;
}

export default function MembershipPage() {
    const [activeTab, setActiveTab] = useState<'plans' | 'memberships'>('plans');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: plansData, isLoading: plansLoading, mutate: mutatePlans } = useSWR(
        activeTab === 'plans' ? 'membership-plans' : null,
        () => membershipApi.adminListMembershipPlans()
    );

    const { data: membershipsData, isLoading: membershipsLoading, mutate: mutateMemberships } = useSWR(
        ['memberships', searchTerm],
        () => membershipApi.adminListMemberships()
    );

    const { data: statsData } = useSWR(
        'membership-stats',
        () => membershipApi.adminMembershipStats()
    );

    const plans: MembershipPlan[] = plansData?.data || [];
    const memberships: Membership[] = membershipsData?.data || [];
    const stats = statsData || { activeMembers: 0, newUsersCount: 0, totalRevenue: 0 };

    const handleDeletePlan = async (id: string) => {
        if (confirm('Are you sure you want to delete this membership plan?')) {
            try {
                await membershipApi.adminDeleteMembershipPlan(id);
                mutatePlans();
            } catch (error) {
                console.error('Failed to delete plan:', error);
                alert('Failed to delete plan');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight leading-none">Membership Console</h1>
                    <div className="flex items-center gap-1 mt-4 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`text-xs font-bold px-5 py-2 rounded-xl transition-all ${activeTab === 'plans' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            Plans
                        </button>
                        <button
                            onClick={() => setActiveTab('memberships')}
                            className={`text-xs font-bold px-5 py-2 rounded-xl transition-all ${activeTab === 'memberships' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            Members
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col min-w-[140px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Plans</span>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-bold text-white leading-none">{stats.activeMembers || 0}</span>
                            <TrendingUp className="w-4 h-4 text-emerald-500 mb-0.5" />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col min-w-[140px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Users</span>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-bold text-white leading-none">{stats.newUsersCount || 0}</span>
                            <Users className="w-4 h-4 text-blue-500 mb-0.5" />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col min-w-[140px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue</span>
                        <div className="flex items-end justify-between mt-1">
                            <span className="text-2xl font-bold text-emerald-400 leading-none">₮{((stats.totalRevenue || 0) / 1000).toFixed(1)}k</span>
                            <DollarSign className="w-4 h-4 text-emerald-500 mb-0.5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {activeTab === 'memberships' && (
                        <div className="relative group overflow-hidden">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full md:w-80 bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'plans' ? (
                        <button
                            onClick={() => { setSelectedPlan(undefined); setIsPlanModalOpen(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Plan</span>
                        </button>
                    ) : activeTab === 'memberships' ? (
                        <button
                            onClick={() => setIsGrantModalOpen(true)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold border border-white/10 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            <span>Grant Access</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white/5 border border-white/10 rounded-4xl overflow-hidden shadow-2xl backdrop-blur-md">
                {activeTab === 'plans' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/2">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan & Order</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {plansLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                                <p className="text-gray-500 font-medium animate-pulse">Fetching plans...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : plans.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <CreditCard className="w-16 h-16" />
                                                <p className="italic font-medium text-xl">No plans defined yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    plans.sort((a: MembershipPlan, b: MembershipPlan) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((plan: MembershipPlan) => (
                                        <tr key={plan._id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-blue-500 transition-colors">
                                                        #{plan.sortOrder || 0}
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{plan.title}</span>
                                                        <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[200px]">{plan.description || 'No description'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-bold text-gray-300">{plan.months} {plan.months === 1 ? 'Month' : 'Months'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4 text-emerald-400/50" />
                                                    <span className="text-sm font-black text-white">₮{plan.price.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${plan.isActive
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-white/5 border-white/10 text-gray-500'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${plan.isActive ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-gray-500'}`} />
                                                    {plan.isActive ? 'Live' : 'Hidden'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => { setSelectedPlan(plan); setIsPlanModalOpen(true); }}
                                                        className="p-2.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <Edit2 className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePlan(plan._id)}
                                                        className="p-2.5 bg-white/5 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/2">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subscriber</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">Expiry</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {membershipsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : memberships.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center opacity-20">
                                            <Users className="w-16 h-16 mx-auto mb-4" />
                                            <p className="italic font-medium">No active subscriptions found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    memberships.map((m: Membership) => (
                                        <tr key={m._id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase text-[11px] tracking-tight">
                                                        {m.user?.name || m.user?.username || 'Unknown User'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{m.user?.email || 'No email provided'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg inline-block text-[10px] font-bold text-gray-400 whitespace-nowrap">
                                                    {m.plan?.title || m.planTitle}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <span className="text-xs font-medium text-gray-300 whitespace-nowrap text-left">
                                                    {new Date(m.expiresAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${m.status === 'active'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${m.status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-red-500'}`} />
                                                    {m.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 transition-all opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <MembershipPlanModal
                isOpen={isPlanModalOpen}
                onClose={() => { setIsPlanModalOpen(false); setSelectedPlan(undefined); }}
                onSuccess={() => mutatePlans()}
                plan={selectedPlan}
            />

            <GrantMembershipModal
                isOpen={isGrantModalOpen}
                onClose={() => setIsGrantModalOpen(false)}
                onSuccess={() => mutateMemberships()}
            />
        </div>
    );
}
