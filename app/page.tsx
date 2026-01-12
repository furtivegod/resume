"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Auth from "@/components/Auth";
import ResumeForm from "@/components/ResumeForm";
import ResultDisplay from "@/components/ResultDisplay";

export interface ResumeExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description?: string;
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

interface AnalysisResponse {
  resume: UpdatedResume;
  pdfBase64?: string;
  pdfError?: string;
}

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [pdfError, setPdfError] = useState<string | undefined>(undefined);
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

  const handleSubmit = async (
    jd: string,
    resumeContent: string,
    template?: string,
    profileData?: any,
    apiProvider?: "anthropic" | "openai"
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPdfBase64(undefined);
    setPdfError(undefined);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          jd, 
          resumeContent, 
          template,
          profileData, // Pass profile data from ResumeForm
          apiProvider: apiProvider || "anthropic" // Pass API provider selection
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data: AnalysisResponse = await response.json();
      setResult(data.resume);
      
      // Validate and set PDF base64
      if (data.pdfBase64) {
        // Ensure it's a valid base64 string
        const base64Str = String(data.pdfBase64).trim();
        if (base64Str.length > 0) {
          console.log(`PDF received: ${base64Str.length} characters`);
          setPdfBase64(base64Str);
        } else {
          console.warn("PDF base64 is empty");
          setPdfBase64(undefined);
        }
      } else {
        setPdfBase64(undefined);
      }
      
      setPdfError(data.pdfError);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Resume Generator
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                AI-powered resume optimization for your dream job
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Profile
              </Link>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Generate Your Resume
              </h2>
              <p className="text-gray-600">
                Enter the job description and your resume will be optimized
                automatically
              </p>
            </div>
            <ResumeForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Your Resume
              </h2>
              <p className="text-gray-600">
                Download your optimized resume once it's generated
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Generating your optimized resume...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few moments
                </p>
              </div>
            )}

            {result && !loading && (
              <ResultDisplay 
                result={result} 
                pdfBase64={pdfBase64}
                pdfError={pdfError}
              />
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Ready to Generate
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Fill out the form on the left and click "Generate Resume" to
                  create your optimized resume
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
