"use client";

import { AnalysisResult } from "@/app/page";

interface ResultDisplayProps {
  result: AnalysisResult;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const handleCopyJSON = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert("Resume JSON copied to clipboard!");
  };

  if (!result) {
    return null;
  }

  const jsonString = JSON.stringify(result, null, 2);

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-indigo-900">Resume JSON</h2>
          <button
            onClick={handleCopyJSON}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            Copy JSON
          </button>
        </div>
        <div className="bg-white p-4 rounded border border-indigo-200 overflow-x-auto">
          <pre className="text-xs text-gray-800 font-mono whitespace-pre">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
}
