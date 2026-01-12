"use client";

import React from "react";
import { AnalysisResult } from "@/app/page";

interface ResultDisplayProps {
  result: AnalysisResult;
  pdfBase64?: string;
  pdfError?: string;
}

export default function ResultDisplay({
  result,
  pdfBase64,
  pdfError,
}: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPDF = React.useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!pdfBase64) {
      alert("PDF is not available. Please try generating the resume again.");
      return;
    }

    if (isDownloading) {
      return; // Prevent multiple simultaneous downloads
    }

    setIsDownloading(true);

    try {
      // Validate base64 string
      if (!pdfBase64 || pdfBase64.trim().length === 0) {
        throw new Error("PDF data is empty");
      }

      // Remove data URL prefix if present
      let base64Data = pdfBase64;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      // Convert base64 to blob
      let byteCharacters;
      try {
        byteCharacters = atob(base64Data);
      } catch (decodeError) {
        console.error("Base64 decode error:", decodeError);
        throw new Error("Invalid PDF data format");
      }

      if (byteCharacters.length === 0) {
        throw new Error("PDF data is empty after decoding");
      }

      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Validate blob size
      if (blob.size === 0) {
        throw new Error("Generated PDF blob is empty (0 bytes)");
      }

      console.log(`PDF blob created successfully: ${blob.size} bytes`);

      const fileName = `${(result.name || "resume").replace(/[^a-z0-9]/gi, "_")}.pdf`;

      // Use standard download method (more reliable)
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setIsDownloading(false);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [pdfBase64, result.name, isDownloading]);

  if (!result) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border-2 border-green-200 shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Resume Generated Successfully!
          </h3>
          <p className="text-gray-600">
            {pdfBase64
              ? "Your optimized resume is ready to download"
              : pdfError
              ? "Resume generated, but PDF creation failed"
              : "Generating PDF..."}
          </p>
        </div>

        {pdfError && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>PDF Error:</strong> {pdfError}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              The resume data was generated successfully. Please check your
              PDFShift API key configuration.
            </p>
          </div>
        )}

        <button
          onClick={handleDownloadPDF}
          disabled={!pdfBase64 || isDownloading}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg transform hover:scale-105"
        >
          <svg
            className="w-6 h-6"
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
          {isDownloading
            ? "Downloading..."
            : pdfBase64
            ? "Download PDF Resume"
            : pdfError
            ? "PDF Not Available"
            : "Generating PDF..."}
        </button>

        {result.name && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Generated for: <span className="font-semibold">{result.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
