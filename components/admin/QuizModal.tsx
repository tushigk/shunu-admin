"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus, Trash2, CheckCircle2, Settings, ListTree, Target, BrainCircuit, Globe, Clock, Hash, FileJson, AlertCircle } from 'lucide-react';
import { quizApi } from '@/apis';
import { ImagePicker } from '../form/image-picker';

export type QuizStatus = "draft" | "published" | "archived";
export type QuizQuestionType = "likert" | "single_choice";
export type QuizTieBreaker = "top_2_traits" | "top_trait";
export type QuizScoringMethod = "sum_traits";

export interface IQuizTrait {
    key: string;
    label: string;
}

export interface IQuizScale {
    type?: string;
    min: number;
    max: number;
    labels?: Record<string, string>;
}

export interface IQuizOption {
    id: string;
    label: string;
    traitScores?: Record<string, number>;
}

export interface IQuizQuestion {
    id: string;
    type: QuizQuestionType;
    prompt: string;
    required?: boolean;
    shuffleOptions?: boolean;
    scoring?: Record<string, number[]>; // For likert, array of scores per trait
    options?: IQuizOption[]; // For single_choice
    scale?: IQuizScale; // For likert
    note?: string;
}

export interface IQuizResultProfile {
    id: string;
    title: string;
    description: string;
    topTraits: string[];
}

export interface IQuizScoringExtraOutput {
    key: string;
    fromQuestionId: string;
    type: "single_choice_label";
}

export interface IQuizScoringRules {
    method: QuizScoringMethod;
    tieBreaker?: QuizTieBreaker;
    minQuestionsToCompute?: number;
    extraOutputs?: IQuizScoringExtraOutput[];
}

export interface IQuizSettings {
    shuffleQuestions?: boolean;
    showProgress?: boolean;
    requireAll?: boolean;
}

export interface IQuiz {
    _id: string;
    slug: string;
    title: string;
    language: string;
    version: number;
    estimatedMinutes?: number;
    description?: string;
    image?: {
        _id: string;
        url: string;
    };
    status: QuizStatus;
    settings?: IQuizSettings;
    traits: IQuizTrait[];
    scale?: IQuizScale;
    questions: IQuizQuestion[];
    resultProfiles: IQuizResultProfile[];
    scoringRules: IQuizScoringRules;
    createdAt?: string;
    updatedAt?: string;
}

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    quiz?: IQuiz;
}

type TabType = 'general' | 'traits' | 'questions' | 'results' | 'scoring';

export default function QuizModal({ isOpen, onClose, onSuccess, quiz }: QuizModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [formData, setFormData] = useState<Partial<IQuiz>>({
        _id: '',
        slug: '',
        title: '',
        language: 'mn',
        version: 1,
        estimatedMinutes: 5,
        description: '',
        status: 'draft',
        settings: {
            shuffleQuestions: false,
            showProgress: true,
            requireAll: true
        },
        traits: [],
        questions: [],
        resultProfiles: [],
        scoringRules: {
            method: 'sum_traits',
            tieBreaker: 'top_trait'
        }
    });

    useEffect(() => {
        if (quiz) {
            setFormData(quiz);
        } else {
            setFormData({
                _id: '',
                slug: '',
                title: '',
                language: 'mn',
                version: 1,
                estimatedMinutes: 5,
                description: '',
                status: 'draft',
                settings: {
                    shuffleQuestions: false,
                    showProgress: true,
                    requireAll: true
                },
                traits: [{ key: 'trait1', label: 'Trait 1' }],
                questions: [],
                resultProfiles: [],
                scoringRules: {
                    method: 'sum_traits',
                    tieBreaker: 'top_trait'
                }
            });
        }
    }, [quiz, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value
        }));
    };

    const handleNestedChange = (
        path: string,
        value: unknown
    ) => {
        const keys = path.split('.');
        setFormData(prev => {
            const newState = { ...prev };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let current = newState as any;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };

    const addTrait = () => {
        const traits = [...(formData.traits || [])];
        const nextId = traits.length + 1;
        traits.push({ key: `trait${nextId}`, label: `Trait ${nextId}` });
        setFormData(prev => ({ ...prev, traits }));
    };

    const removeTrait = (index: number) => {
        const traits = [...(formData.traits || [])];
        traits.splice(index, 1);
        setFormData(prev => ({ ...prev, traits }));
    };

    const addQuestion = (type: QuizQuestionType = 'single_choice') => {
        const questions = [...(formData.questions || [])];
        const id = `q${Date.now()}`;
        if (type === 'single_choice') {
            questions.push({
                id,
                type: 'single_choice',
                prompt: '',
                required: true,
                options: [
                    { id: 'opt1', label: '', traitScores: {} },
                    { id: 'opt2', label: '', traitScores: {} }
                ]
            });
        } else {
            questions.push({
                id,
                type: 'likert',
                prompt: '',
                required: true,
                scale: { min: 1, max: 5 },
                scoring: {}
            });
        }
        setFormData(prev => ({ ...prev, questions }));
    };

    const addResultProfile = () => {
        const results = [...(formData.resultProfiles || [])];
        results.push({
            id: `res${Date.now()}`,
            title: '',
            description: '',
            topTraits: []
        });
        setFormData(prev => ({ ...prev, resultProfiles: results }));
    };

    const handleImportJson = () => {
        try {
            // Using a more flexible parser to handle JS-like objects (unquoted keys)
            // but wrapped in try-catch for safety
            let parsed;
            try {
                parsed = JSON.parse(jsonInput);
            } catch {
                // If strict JSON fails, try evaluating it as a JS object
                // We use Function instead of eval for a slightly better sandboxing
                parsed = new Function(`return ${jsonInput}`)();
            }

            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Imported data must be an object');
            }

            setFormData(prev => ({
                ...prev,
                ...parsed,
                // Retain current ID if we're editing
                _id: quiz?._id || parsed._id || prev._id,
                // Ensure defaults for nested objects if missing
                settings: { ...prev.settings, ...parsed.settings },
                scoringRules: { ...prev.scoringRules, ...parsed.scoringRules }
            }));

            setIsImportModalOpen(false);
            setJsonInput('');
            alert('Successfully imported configuration');
        } catch (error: unknown) {
            console.error('Import Error:', error);
            const message = error instanceof Error ? error.message : String(error);
            alert('Failed to parse JSON: ' + message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                image: (formData.image as { id?: string; _id?: string } | undefined)?.id ||
                    (formData.image as { id?: string; _id?: string } | undefined)?._id ||
                    (typeof formData.image === 'string' ? formData.image : null),
            };

            if (quiz) {
                await quizApi.adminUpdateQuiz(quiz._id, payload);
            } else {
                await quizApi.adminCreateQuiz(payload);
            }

            onSuccess();
            onClose();
        } catch (error: unknown) {
            console.error('Quiz Save Error:', error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            alert(message || 'Failed to save quiz definition');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const navItems = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'traits', label: 'Traits', icon: BrainCircuit },
        { id: 'questions', label: 'Questions', icon: ListTree },
        { id: 'results', label: 'Results', icon: Target },
        { id: 'scoring', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-6xl max-h-[95vh] bg-[#121214] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{quiz ? 'Evolutionize Quiz' : 'Architect New Quiz'}</h2>
                        <p className="text-sm text-gray-500 mt-1">Multi-dimensional personality & logic engine</p>
                    </div>

                    <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 mx-6">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabType)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/10 text-xs font-bold"
                        >
                            <FileJson className="w-4 h-4 text-amber-500" />
                            Import JSON
                        </button>

                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* JSON Import Overlay */}
                {isImportModalOpen && (
                    <div className="absolute inset-x-0 top-[89px] bottom-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-xl flex flex-col p-8 animate-in fade-in duration-200">
                        <div className="max-w-4xl mx-auto w-full flex flex-col h-full gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <FileJson className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Import Matrix Definition</h3>
                                        <p className="text-sm text-gray-500">Paste your JSON configuration below to automatically populate the architecture</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 relative">
                                <textarea
                                    className="w-full h-full bg-black/40 border border-white/10 rounded-3xl p-6 text-sm font-mono text-blue-300 placeholder-gray-700 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
                                    placeholder='{ "title": "...", "traits": [...], "questions": [...] }'
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                />
                                {jsonInput && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-lg text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                                        <AlertCircle className="w-3 h-3" />
                                        Unsaved changes will be overwritten
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between py-4 border-t border-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Supports</span>
                                        <span className="text-xs font-bold text-gray-400">Strict JSON & JS Objects</span>
                                    </div>
                                    <div className="h-8 w-px bg-white/5" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target</span>
                                        <span className="text-xs font-bold text-gray-400">{formData.title || 'Untitled Matrix'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleImportJson}
                                        className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-600/20 active:scale-95"
                                    >
                                        Execute Import
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form id="quiz-form" onSubmit={handleSubmit} className="space-y-8">
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Quiz Title</label>
                                            <input required name="title" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" value={formData.title} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">ID / Slug</label>
                                            <input required name="slug" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono text-sm" value={formData.slug} onChange={handleChange} placeholder="personality-test" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Language</label>
                                            <select name="language" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" value={formData.language} onChange={handleChange}>
                                                <option value="mn" className="bg-[#121214]">Mongolian</option>
                                                <option value="en" className="bg-[#121214]">English</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Version</label>
                                            <input type="number" name="version" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" value={formData.version} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Time (Min)</label>
                                            <input type="number" name="estimatedMinutes" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" value={formData.estimatedMinutes} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Description</label>
                                        <textarea name="description" rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-sm" value={formData.description} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Featured Image</label>
                                        <ImagePicker
                                            label="Cover"
                                            value={formData.image ? { id: formData.image._id, url: formData.image.url } : null}
                                            onChange={(img) => setFormData(p => ({ ...p, image: img ? { _id: img.id || '', url: img.url || '' } : undefined }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Status</label>
                                        <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                                            {['draft', 'published', 'archived'].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, status: s as QuizStatus }))}
                                                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'traits' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        Trait Definitions
                                        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400">Defined Scopes</span>
                                    </h3>
                                    <button type="button" onClick={addTrait} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Trait
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {formData.traits?.map((trait, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 group relative">
                                            <button onClick={() => removeTrait(idx)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Key Identifier</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-blue-500 outline-none font-mono text-xs"
                                                    value={trait.key}
                                                    onChange={(e) => {
                                                        const newTraits = [...(formData.traits || [])];
                                                        newTraits[idx].key = e.target.value;
                                                        setFormData(p => ({ ...p, traits: newTraits }));
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Label</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-blue-500 outline-none text-xs"
                                                    value={trait.label}
                                                    onChange={(e) => {
                                                        const newTraits = [...(formData.traits || [])];
                                                        newTraits[idx].label = e.target.value;
                                                        setFormData(p => ({ ...p, traits: newTraits }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'questions' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Quiz Questions ({formData.questions?.length})</h3>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => addQuestion('single_choice')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-blue-500" /> Multiple Choice
                                        </button>
                                        <button type="button" onClick={() => addQuestion('likert')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-emerald-500" /> Likert Scale
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {formData.questions?.map((q, idx) => (
                                        <div key={idx} className="bg-white/2 border border-white/5 rounded-3xl p-6 space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-sm">#{idx + 1}</span>
                                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {q.type.replace('_', ' ')}
                                                        </div>
                                                        <input
                                                            className="flex-1 bg-transparent border-b border-white/5 focus:border-blue-500 outline-none text-white font-bold py-1 px-0"
                                                            placeholder="Enter question prompt..."
                                                            value={q.prompt}
                                                            onChange={(e) => {
                                                                const qs = [...(formData.questions || [])];
                                                                qs[idx].prompt = e.target.value;
                                                                setFormData(p => ({ ...p, questions: qs }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const qs = [...(formData.questions || [])];
                                                        qs.splice(idx, 1);
                                                        setFormData(p => ({ ...p, questions: qs }));
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {q.type === 'single_choice' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                                                    {q.options?.map((opt, oIdx) => (
                                                        <div key={oIdx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white font-medium"
                                                                    placeholder={`Option ${oIdx + 1}`}
                                                                    value={opt.label}
                                                                    onChange={(e) => {
                                                                        const qs = [...(formData.questions || [])];
                                                                        qs[idx].options![oIdx].label = e.target.value;
                                                                        setFormData(p => ({ ...p, questions: qs }));
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const qs = [...(formData.questions || [])];
                                                                        qs[idx].options?.splice(oIdx, 1);
                                                                        setFormData(p => ({ ...p, questions: qs }));
                                                                    }}
                                                                    className="text-gray-500 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2 pt-2 border-t border-white/5">
                                                                <label className="text-[9px] font-bold text-gray-500 uppercase">Trait Scoring</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {formData.traits?.map((trait) => (
                                                                        <div key={trait.key} className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                                                                            <span className="text-[9px] text-gray-400 font-mono">{trait.key}:</span>
                                                                            <input
                                                                                type="number"
                                                                                className="w-10 bg-transparent border-none p-0 text-[10px] text-blue-400 font-bold focus:ring-0"
                                                                                value={opt.traitScores?.[trait.key] || 0}
                                                                                onChange={(e) => {
                                                                                    const qs = [...(formData.questions || [])];
                                                                                    const scores = { ...(opt.traitScores || {}) };
                                                                                    const val = parseInt(e.target.value);
                                                                                    scores[trait.key] = isNaN(val) ? 0 : val;
                                                                                    qs[idx].options![oIdx].traitScores = scores;
                                                                                    setFormData(p => ({ ...p, questions: qs }));
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const qs = [...(formData.questions || [])];
                                                            qs[idx].options?.push({ id: `opt${Date.now()}`, label: '', traitScores: {} });
                                                            setFormData(p => ({ ...p, questions: qs }));
                                                        }}
                                                        className="border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center py-4 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" /> Add Selection Option
                                                    </button>
                                                </div>
                                            )}

                                            {q.type === 'likert' && (
                                                <div className="ml-12 space-y-4">
                                                    <div className="flex items-center gap-8 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-gray-400">Scale Min:</span>
                                                            <input type="number" className="w-16 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white" value={q.scale?.min ?? ''} onChange={(e) => {
                                                                const qs = [...(formData.questions || [])];
                                                                const val = parseInt(e.target.value);
                                                                qs[idx].scale = { ...(qs[idx].scale || { min: 0, max: 0 }), min: isNaN(val) ? 0 : val };
                                                                setFormData(p => ({ ...p, questions: qs }));
                                                            }} />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-gray-400">Scale Max:</span>
                                                            <input type="number" className="w-16 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white" value={q.scale?.max ?? ''} onChange={(e) => {
                                                                const qs = [...(formData.questions || [])];
                                                                const val = parseInt(e.target.value);
                                                                qs[idx].scale = { ...(qs[idx].scale || { min: 0, max: 0 }), max: isNaN(val) ? 1 : val };
                                                                setFormData(p => ({ ...p, questions: qs }));
                                                            }} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scale Scoring Matrix (per value)</label>
                                                        <div className="overflow-x-auto bg-[#0a0a0c] rounded-2xl border border-white/5 p-4">
                                                            <table className="w-full text-xs text-left">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="pb-4 text-gray-500">Trait</th>
                                                                        {Array.from({ length: (q.scale?.max || 0) - (q.scale?.min || 0) + 1 }).map((_, i) => (
                                                                            <th key={i} className="pb-4 text-center font-bold text-gray-300">Val {(q.scale?.min || 0) + i}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-white/5">
                                                                    {formData.traits?.map((trait) => (
                                                                        <tr key={trait.key}>
                                                                            <td className="py-3 font-mono text-blue-400 font-bold">{trait.key}</td>
                                                                            {Array.from({ length: (q.scale?.max || 0) - (q.scale?.min || 0) + 1 }).map((_, i) => {
                                                                                const valIdx = i;
                                                                                return (
                                                                                    <td key={i} className="py-3 text-center">
                                                                                        <input
                                                                                            type="number"
                                                                                            className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center font-bold"
                                                                                            value={q.scoring?.[trait.key]?.[valIdx] ?? 0}
                                                                                            onChange={(e) => {
                                                                                                const qs = [...(formData.questions || [])];
                                                                                                const scoring = { ...(qs[idx].scoring || {}) };
                                                                                                const traitScores = [...(scoring[trait.key] || [])];
                                                                                                const val = parseInt(e.target.value);
                                                                                                traitScores[valIdx] = isNaN(val) ? 0 : val;
                                                                                                scoring[trait.key] = traitScores;
                                                                                                qs[idx].scoring = scoring;
                                                                                                setFormData(p => ({ ...p, questions: qs }));
                                                                                            }}
                                                                                        />
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Result Profiles</h3>
                                    <button type="button" onClick={addResultProfile} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Profile
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {formData.resultProfiles?.map((profile, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 group relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const res = [...(formData.resultProfiles || [])];
                                                    res.splice(idx, 1);
                                                    setFormData(p => ({ ...p, resultProfiles: res }));
                                                }}
                                                className="absolute top-6 right-6 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Title</label>
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-blue-500 outline-none"
                                                            value={profile.title}
                                                            onChange={(e) => {
                                                                const res = [...(formData.resultProfiles || [])];
                                                                res[idx].title = e.target.value;
                                                                setFormData(p => ({ ...p, resultProfiles: res }));
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Matched Traits</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {formData.traits?.map((trait) => (
                                                                <button
                                                                    key={trait.key}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const res = [...(formData.resultProfiles || [])];
                                                                        const top = [...profile.topTraits];
                                                                        const exists = top.indexOf(trait.key);
                                                                        if (exists > -1) top.splice(exists, 1);
                                                                        else top.push(trait.key);
                                                                        res[idx].topTraits = top;
                                                                        setFormData(p => ({ ...p, resultProfiles: res }));
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${profile.topTraits.includes(trait.key) ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                                >
                                                                    {trait.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Outcome Description</label>
                                                    <textarea
                                                        rows={6}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-blue-500 outline-none text-sm"
                                                        value={profile.description}
                                                        onChange={(e) => {
                                                            const res = [...(formData.resultProfiles || [])];
                                                            res[idx].description = e.target.value;
                                                            setFormData(p => ({ ...p, resultProfiles: res }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'scoring' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <BrainCircuit className="w-5 h-5 text-purple-500" />
                                        Scoring Algorithms
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Calculation Method</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white outline-none"
                                                value={formData.scoringRules?.method}
                                                onChange={(e) => handleNestedChange('scoringRules.method', e.target.value)}
                                            >
                                                <option value="sum_traits" className="bg-[#121214]">Sum Traits (Aggregated)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tie-Breaker Logic</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'top_trait', label: 'Absolute Peak' },
                                                    { id: 'top_2_traits', label: 'Dual Affinity' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => handleNestedChange('scoringRules.tieBreaker', t.id)}
                                                        className={`py-3 rounded-2xl border text-xs font-bold transition-all ${formData.scoringRules?.tieBreaker === t.id ? 'bg-purple-600/20 border-purple-600 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Min Questions Required</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white outline-none"
                                                value={formData.scoringRules?.minQuestionsToCompute ?? ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    handleNestedChange('scoringRules.minQuestionsToCompute', isNaN(val) ? 0 : val);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <Settings className="w-5 h-5 text-blue-500" />
                                        Behavioral Settings
                                    </h3>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'shuffleQuestions', label: 'Randomize Question Order', icon: Hash },
                                            { key: 'showProgress', label: 'Display Progress Bar', icon: Clock },
                                            { key: 'requireAll', label: 'Enforce Mandatory Responses', icon: CheckCircle2 }
                                        ].map((item) => {
                                            const isChecked = formData.settings?.[item.key as keyof IQuizSettings];
                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    onClick={() => handleNestedChange(`settings.${item.key}`, !isChecked)}
                                                    className={`flex items-center justify-between w-full p-5 rounded-3xl border transition-all ${isChecked
                                                        ? 'bg-blue-600/10 border-blue-600/40 text-blue-400'
                                                        : 'bg-white/5 border-white/10 text-gray-500'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <item.icon className={`w-5 h-5 ${isChecked ? 'text-blue-500' : 'text-gray-600'}`} />
                                                        <span className="font-bold text-sm">{item.label}</span>
                                                    </div>
                                                    <div className={`w-12 h-6 rounded-full relative transition-all ${isChecked ? 'bg-blue-600' : 'bg-white/10'}`}>
                                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isChecked ? 'right-1' : 'left-1'}`} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/10 bg-white/2 flex items-center justify-end gap-4 font-sans">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        form="quiz-form"
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-600/50 disabled:to-blue-500/50 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] active:scale-95"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Syndicating...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{quiz ? 'Update Engine' : 'Deploy Quiz'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
