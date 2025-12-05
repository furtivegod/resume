"use client";

import { useState } from "react";

interface ResumeFormProps {
  onSubmit: (jd: string, resumeContent: string) => void;
  loading: boolean;
}

export default function ResumeForm({ onSubmit, loading }: ResumeFormProps) {
  const [jd, setJd] = useState("");
  const [resumeContent, setResumeContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jd.trim() && resumeContent.trim()) {
      onSubmit(jd, resumeContent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="jd"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Job Description (JD)
        </label>
        <textarea
          id="jd"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={10}
          required
        />
      </div>

      <div>
        <label
          htmlFor="resumeContent"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Resume Content
        </label>
        <textarea
          id="resumeContent"
          value={resumeContent}
          onChange={(e) => setResumeContent(e.target.value)}
          placeholder="Paste your existing resume content here..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={10}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !jd.trim() || !resumeContent.trim()}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>
    </form>
  );
}

