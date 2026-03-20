"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/utils/http";

export type AdvisorAudioValue = {
    url?: string;
    size?: number | null;
    duration?: number | null;
};

type Props = {
    label?: string;
    value: AdvisorAudioValue | null;
    onChange: (value: AdvisorAudioValue | null) => void;
};

type UploadResponse = {
    url?: string;
    size?: number;
    data?: {
        url?: string;
        size?: number;
    };
    message?: string;
};

export function AdvisorAudioUploader({
    label = "MP3 файл",
    value,
    onChange,
}: Props) {
    const [uploading, setUploading] = useState(false);

    const pick = async (file: File) => {
        const form = new FormData();
        form.append("audio", file);

        setUploading(true);
        try {
            const res = await api.post<UploadResponse>("/admin/advisors/audio", form);

            const data = res.data;
            const url = data?.url ?? data?.data?.url;
            if (!url) throw new Error("Баталгаажсан холбоос ирсэнгүй");

            const size = data?.size ?? data?.data?.size ?? file.size;

            const duration = await detectDuration(url).catch(() => null);

            onChange({ url, size, duration });
            toast.success("Аудио хууллаа");
        } catch (err: unknown) {
            toast.error(getErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    const remove = () => onChange(null);

    return (
        <div className="space-y-3">
            <label className="text-xs text-white/70 flex items-center gap-2">
                {label}
                {uploading && (
                    <span className="text-[11px] text-white/50">Uploading…</span>
                )}
            </label>

            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="file"
                        accept="audio/mpeg,audio/mp3,.mp3"
                        disabled={uploading}
                        className="block text-sm file:mr-2 file:rounded-md file:bg-white/10 file:px-3 file:py-1.5 file:text-white file:border-0 hover:file:bg-white/20"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const f = e.target.files?.[0];
                            if (f) void pick(f);
                            // ижил файл дахин сонгоход onChange дахин ажиллах боломжтой болгоно
                            e.target.value = "";
                        }}
                    />

                    {value?.url && (
                        <button
                            type="button"
                            onClick={remove}
                            className="btn btn-sm bg-red-500/20 text-red-200"
                        >
                            Устгах
                        </button>
                    )}
                </div>

                {value?.url ? (
                    <div className="space-y-2">
                        <audio controls src={value.url} className="w-full" />
                        <div className="text-xs text-white/60 flex flex-wrap gap-4">
                            <span>
                                URL:{" "}
                                <a
                                    href={value.url}
                                    className="underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    сонсох
                                </a>
                            </span>

                            {value.duration != null && (
                                <span>Хугацаа: {value.duration.toFixed(1)} сек</span>
                            )}

                            {value.size != null && <span>Хэмжээ: {formatBytes(value.size)}</span>}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-white/50">
                        MP3 файл сонгох эсвэл чирж оруулах боломжтой.
                    </p>
                )}
            </div>
        </div>
    );
}

function detectDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = "metadata";

        const cleanup = () => {
            audio.onloadedmetadata = null;
            audio.onerror = null;
            // зарим browser дээр src цэвэрлэх нь хэрэгтэй байдаг
            audio.src = "";
        };

        audio.onloadedmetadata = () => {
            const d = audio.duration;
            cleanup();
            if (Number.isFinite(d) && d > 0) resolve(d);
            else reject(new Error("duration missing"));
        };

        audio.onerror = () => {
            cleanup();
            reject(new Error("audio load failed"));
        };

        audio.src = url;
    });
}

function formatBytes(bytes?: number | null) {
    if (bytes == null) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;

    // axios-style error shape (safely)
    if (typeof err === "object" && err !== null) {
        const maybeResponse = (err as { response?: unknown }).response;
        if (typeof maybeResponse === "object" && maybeResponse !== null) {
            const maybeData = (maybeResponse as { data?: unknown }).data;
            if (typeof maybeData === "object" && maybeData !== null) {
                const msg = (maybeData as { message?: unknown }).message;
                if (typeof msg === "string" && msg.trim()) return msg;
            }
        }
    }

    return "Аудио хуулж чадсангүй";
}
