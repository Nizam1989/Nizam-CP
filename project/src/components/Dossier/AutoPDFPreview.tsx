import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AutoPDFPreviewProps {
  pdfUrl?: string;
  isLoading: boolean;
  jobId?: string;
}

export function AutoPDFPreview({ pdfUrl, isLoading, jobId }: AutoPDFPreviewProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          Auto PDF Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating dossier preview...</p>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Dossier Preview - {jobId}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Full View
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = pdfUrl;
                      link.download = `Dossier_${jobId}.pdf`;
                      link.click();
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
              <div className="border border-gray-300 rounded bg-white h-96 overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full"
                  title="Dossier Preview"
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">No dossier generated yet</p>
              <p className="text-sm text-gray-500">
                Enter a Job ID and click "Generate Dossier" to see the preview here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}