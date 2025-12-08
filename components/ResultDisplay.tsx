"use client";

import { useState } from "react";
import { AnalysisResult } from "@/app/page";

interface ResultDisplayProps {
  result: AnalysisResult;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleCopyJSON = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert("Resume JSON copied to clipboard!");
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    setIsGeneratingPDF(true);
    try {
      // Dynamically import both the PDF renderer and component to avoid SSR issues
      const { pdf } = await import("@react-pdf/renderer");
      const { ResumePDFDocument } = await import("./ResumePDF");

      const blob = await pdf(<ResumePDFDocument resume={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.name || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Full error:", error);
      alert(
        `Failed to generate PDF: ${errorMessage}. Please check the console for details.`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!result) {
    return null;
  }

  const jsonString = JSON.stringify(result, null, 2);

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Action Buttons - Prominent Placement */}
      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-green-900 mb-1">
              Download Your Resume
            </h3>
            <p className="text-sm text-green-700">
              Generate and download a professional PDF resume
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* JSON Display */}
      <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
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
