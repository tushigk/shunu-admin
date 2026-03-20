"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

type QuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

// Declare dynamic component outside of the main component to prevent unnecessary re-mounts
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[200px] flex items-center justify-center text-gray-400 bg-white/5 border border-white/10 rounded-xl"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading Editor...</span>
      </div>
    </div>
  ),
});

export default function QuillEditor({
  value = "",
  onChange,
  className = "",
  placeholder = "Enter content..."
}: QuillEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
  ];

  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="quill-editor"
      />
    </div>
  );
}
