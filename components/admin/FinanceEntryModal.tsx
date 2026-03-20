"use client";

import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { financeApi } from '@/apis/finance';
import toast from 'react-hot-toast';

interface FinanceEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FINANCE_TYPES = [
    { label: 'Income (Орлого)', value: 'income' },
    { label: 'Social (Нийгмийн)', value: 'social' },
    { label: 'Other (Бусад)', value: 'other' },
];

export default function FinanceEntryModal({ isOpen, onClose, onSuccess }: FinanceEntryModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        note: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.note) {
            toast.error('Бүх талбарыг бөглөнө үү');
            return;
        }

        setIsLoading(true);
        try {
            await financeApi.create({
                type: formData.type,
                amount: Number(formData.amount),
                note: formData.note,
            });
            toast.success('Амжилттай хадгалагдлаа');
            onSuccess();
            onClose();
            setFormData({ type: 'income', amount: '', note: '' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : (error as { message?: string })?.message || 'Алдаа гарлаа';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#16161a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Шинэ гүйлгээ</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Төрөл</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {FINANCE_TYPES.map((type) => (
                                <option key={type.value} value={type.value} className="bg-[#16161a]">
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Дүн</label>
                        <input
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                            placeholder="0"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Тайлбар</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors min-h-[100px] resize-none"
                            placeholder="Гүйлгээний утга..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all active:scale-95"
                        >
                            Цуцлах
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Хадгалах</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
