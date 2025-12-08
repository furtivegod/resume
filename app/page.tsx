"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Auth from "@/components/Auth";
import ResumeForm from "@/components/ResumeForm";
import ResultDisplay from "@/components/ResultDisplay";

export interface ResumeExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  achievements?: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
}

export interface ResumeProject {
  name: string;
  description?: string;
  technologies?: string[];
}

export interface UpdatedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experience?: ResumeExperience[];
  skills?: Record<string, string[]>;
  education?: ResumeEducation[];
  certifications?: string[];
  projects?: ResumeProject[];
}

export type AnalysisResult = UpdatedResume;

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const handleSubmit = async (jd: string, resumeContent: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jd, resumeContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const data: UpdatedResume = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Resume Analyzer
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ResumeForm onSubmit={handleSubmit} loading={loading} />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {result && <ResultDisplay result={result} />}
            {!result && !loading && !error && (
              <div className="text-center text-gray-500 h-64 flex items-center justify-center">
                <p>Your resume JSON will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
