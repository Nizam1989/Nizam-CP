import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DossierControlPanelProps {
  onDossierGenerate: (jobId: string) => void;
  generationStatus: 'idle' | 'pending' | 'success' | 'error';
  generatedDossierUrl?: string;
}

export function DossierControlPanel({ 
  onDossierGenerate, 
  generationStatus, 
  generatedDossierUrl 
}: DossierControlPanelProps) {
  const [jobId, setJobId] = useState('');

  const handleGenerate = () => {
    if (jobId.trim()) {
      onDossierGenerate(jobId.trim());
    }
  };

  const getStatusIcon = () => {
    switch (generationStatus) {
      case 'pending':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <div className="w-4 h-4 bg-green-600 rounded-full" />;
      case 'error':
        return <div className="w-4 h-4 bg-red-600 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = () => {
    switch (generationStatus) {
      case 'pending':
        return 'Generating dossier...';
      case 'success':
        return 'Dossier generated successfully';
      case 'error':
        return 'Error generating dossier';
      default:
        return 'Ready to generate';
    }
  };

  const getStatusColor = () => {
    switch (generationStatus) {
      case 'pending':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          Dossier Automation - Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-1">
              Job ID
            </label>
            <Input
              id="jobId"
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter Job ID (e.g., CAP-250123-01)"
              className="w-full"
              disabled={generationStatus === 'pending'}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={!jobId.trim() || generationStatus === 'pending'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generationStatus === 'pending' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Generate'
              )}
              Generate Dossier
            </button>
            {generationStatus === 'success' && generatedDossierUrl && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedDossierUrl;
                  link.download = `Quality_Dossier_${jobId}.pdf`;
                  link.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Status Display */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            Status: {getStatusText()}
          </span>
          {generationStatus === 'success' && generatedDossierUrl && (
            <button
              onClick={() => window.open(generatedDossierUrl, '_blank')}
              className="ml-auto px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Download
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {generationStatus === 'pending' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}