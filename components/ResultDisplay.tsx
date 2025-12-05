"use client";

import { AnalysisResult } from "@/app/page";

interface ResultDisplayProps {
  result: AnalysisResult;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const handleCopyJSON = () => {
    if (result.updatedResume) {
      const jsonString = JSON.stringify(result.updatedResume, null, 2);
      navigator.clipboard.writeText(jsonString);
      alert("Resume JSON copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Results</h2>

      {result.updatedResume && (
        <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-indigo-900 text-lg">Updated Resume (JSON)</h3>
            <button
              onClick={handleCopyJSON}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <div className="bg-white p-4 rounded border border-indigo-200 overflow-x-auto">
            <pre className="text-xs text-gray-800 font-mono whitespace-pre">
              {JSON.stringify(result.updatedResume, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {result.summary && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
          <p className="text-blue-800">{result.summary}</p>
        </div>
      )}

      {result.experience && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Experience</h3>
          <p className="text-green-800 whitespace-pre-wrap">{result.experience}</p>
        </div>
      )}

      {result.skills && result.skills.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {result.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.education && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">Education</h3>
          <p className="text-yellow-800 whitespace-pre-wrap">{result.education}</p>
        </div>
      )}

      {result.recommendations && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">Recommendations</h3>
          <p className="text-orange-800 whitespace-pre-wrap">{result.recommendations}</p>
        </div>
      )}

      {!result.summary && !result.experience && !result.skills && !result.education && !result.recommendations && (
        <div className="text-center text-gray-500 p-8">
          <p>No analysis data available</p>
        </div>
      )}
    </div>
  );
}

