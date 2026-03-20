"use client";

import React, { useState } from 'react';
import { X, Loader2, Save, Calendar, Tag, FileText, Globe, EyeOff, Pin } from 'lucide-react';
import { newsApi } from '@/apis';
import useSWR from 'swr';
import { ImagePicker } from '../form/image-picker';
import QuillEditor from '../form/html-editor';

interface Category {
    _id: string;
    name: string;
}

interface Article {
    _id: string;
    title: string;
    image?: {
        _id: string;
        url: string;
    };
    summary?: string;
    contentHtml?: string;
    categories?: Category[];
    publishedAt: string;
    createdAt: string;
    isPublished: boolean;
    isPinned: boolean;
}

interface ArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    article?: Article; // The article object to edit
}

export default function ArticleModal({ isOpen, onClose, onSuccess, article }: ArticleModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        image: null as { id?: string; url?: string } | null,
        categories: [] as string[],
        contentHtml: '',
        publishedAt: new Date().toISOString().slice(0, 16),
        isPublished: true,
        isPinned: false,
    });

    // Populate form data when article is provided
    React.useEffect(() => {
        if (article) {
            setFormData({
                title: article.title || '',
                image: article.image ? { id: article.image._id, url: article.image.url } : null,
                categories: article.categories ? article.categories.map((cat: Category) => cat._id) : [],
                contentHtml: article.contentHtml || '',
                publishedAt: (article.publishedAt || article.createdAt || new Date().toISOString()).slice(0, 16),
                isPublished: article.isPublished ?? true,
                isPinned: article.isPinned ?? false,
            });
        } else {
            setFormData({
                title: '',
                image: null,
                categories: [],
                contentHtml: '',
                publishedAt: new Date().toISOString().slice(0, 16),
                isPublished: true,
                isPinned: false,
            });
        }
    }, [article, isOpen]);

    const { data: categoriesData, isLoading: categoriesLoading } = useSWR(
        isOpen ? 'article-categories' : null,
        () => newsApi.adminListArticleCategories()
    );

    const categories = categoriesData?.data || [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: string) => {
        setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
    };

    const handleCategoryChange = (categoryId: string) => {
        setFormData(prev => {
            const newCategories = prev.categories.includes(categoryId)
                ? prev.categories.filter(id => id !== categoryId)
                : [...prev.categories, categoryId];
            return { ...prev, categories: newCategories };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                image: formData.image?.id || null,
                publishedAt: new Date(formData.publishedAt).toISOString(),
            };

            if (article) {
                await newsApi.adminUpdateArticle(article._id, payload);
            } else {
                await newsApi.adminCreateArticle(payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(article ? 'Failed to update article:' : 'Failed to create article:', error);
            alert(article ? 'Failed to update article.' : 'Failed to create article.');
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
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121214] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 font-sans">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{article ? 'Update Article' : 'Create New Article'}</h2>
                        <p className="text-sm text-gray-500 mt-1">{article ? 'Modify the existing story' : 'Publish a new story to the platform'}</p>
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
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <form id="article-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Title Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Article Title</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    required
                                    type="text"
                                    name="title"
                                    placeholder="Enter a compelling title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-lg font-medium"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Image Upload Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400 ml-1">Article Thumbnail</label>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:border-white/20">
                                    <ImagePicker
                                        label="Thumbnail Image"
                                        value={formData.image}
                                        onChange={(img) => setFormData(prev => ({ ...prev, image: img }))}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 ml-1 italic">Click the input or drop an image to upload</p>
                            </div>

                            {/* Publish Date Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400 ml-1">Publish Date & Time</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        required
                                        type="datetime-local"
                                        name="publishedAt"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        value={formData.publishedAt}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categories Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Categories</label>
                            {categoriesLoading ? (
                                <div className="flex items-center gap-2 text-gray-500 italic p-4 bg-white/2 rounded-2xl border border-white/5">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading categories...</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat: Category) => (
                                        <button
                                            key={cat._id}
                                            type="button"
                                            onClick={() => handleCategoryChange(cat._id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${formData.categories.includes(cat._id)
                                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <Tag className="w-3.5 h-3.5" />
                                            <span className="text-sm font-medium">{cat.name}</span>
                                        </button>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="text-gray-500 italic text-sm p-4 bg-white/2 rounded-2xl border border-white/5 w-full">
                                            No categories found.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleToggle('isPublished')}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.isPublished
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-white/5 border-white/10 text-gray-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {formData.isPublished ? (
                                        <Globe className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <EyeOff className="w-5 h-5" />
                                    )}
                                    <span className="font-semibold">Published Status</span>
                                </div>
                                <span
                                    className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${formData.isPublished ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                                        }`}
                                >
                                    {formData.isPublished ? 'Active' : 'Draft'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleToggle('isPinned')}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.isPinned
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-white/5 border-white/10 text-gray-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Pin className={`w-5 h-5 ${formData.isPinned ? 'text-amber-500' : ''}`} />
                                    <span className="font-semibold">Pinned</span>
                                </div>
                                <span
                                    className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${formData.isPinned ? 'bg-amber-500/20' : 'bg-gray-500/20'
                                        }`}
                                >
                                    {formData.isPinned ? 'Pinned' : 'Normal'}
                                </span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-400 ml-1">Content (HTML)</label>
                                <span className="text-xs text-gray-500 italic">Rich text editor</span>
                            </div>
                            <QuillEditor
                                value={formData.contentHtml}
                                onChange={(value) => setFormData(prev => ({ ...prev, contentHtml: value }))}
                                placeholder="Enter your story description with rich formatting..."
                            />
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
                        form="article-form"
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{article ? 'Updating...' : 'Creating...'}</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{article ? 'Update Article' : 'Create Article'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
