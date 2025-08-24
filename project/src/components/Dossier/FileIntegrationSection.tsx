import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileIntegrationSectionProps {
  jobId?: string;
  mtrStatus: 'idle' | 'fetching' | 'found' | 'not_found';
  mtrFileName?: string;
}

export function FileIntegrationSection({ jobId, mtrStatus, mtrFileName }: FileIntegrationSectionProps) {
  const [sharePointConfig, setSharePointConfig] = useState<any>(null);
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [databaseStatus, setDatabaseStatus] = useState<'connected' | 'disconnected'>('connected');

  useEffect(() => {
    // Load real configuration status
    const savedSharePointConfig = localStorage.getItem('sharepoint_config');
    if (savedSharePointConfig) {
      setSharePointConfig(JSON.parse(savedSharePointConfig));
    }
    
    const savedEmailConfig = localStorage.getItem('email_config');
    if (savedEmailConfig) {
      setEmailConfig(JSON.parse(savedEmailConfig));
    }

    // Check database connectivity (localStorage availability)
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      setDatabaseStatus('connected');
    } catch (error) {
      setDatabaseStatus('disconnected');
    }
  }, []);

  const getMTRStatusIcon = () => {
    switch (mtrStatus) {
      case 'fetching':
        return <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>;
      case 'found':
        return <div className="w-4 h-4 bg-green-600 rounded-full"></div>;
      case 'not_found':
        return <div className="w-4 h-4 bg-red-600 rounded-full"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getMTRStatusText = () => {
    switch (mtrStatus) {
      case 'fetching':
        return 'Searching SharePoint...';
      case 'found':
        return `${mtrFileName} – Found ✅`;
      case 'not_found':
        return 'MTR file not found ❌';
      default:
        return 'Ready to fetch MTR file';
    }
  };

  const getMTRStatusColor = () => {
    switch (mtrStatus) {
      case 'fetching':
        return 'text-blue-600';
      case 'found':
        return 'text-green-600';
      case 'not_found':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          File Integration Section
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Auto-fetch MTR from SharePoint
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            System will fetch MTR file based on Job ID
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {getMTRStatusIcon()}
            <div className="flex-1">
              <p className={`text-sm font-medium ${getMTRStatusColor()}`}>
                {getMTRStatusText()}
              </p>
              {jobId && mtrStatus !== 'idle' && (
                <p className="text-xs text-gray-500 mt-1">
                  Looking for: MTR_{jobId}.pdf
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Integration Status:</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm text-gray-600">SharePoint Connection</span>
              {sharePointConfig?.isConfigured ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Connected
                </span>
              ) : (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  Not Connected
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm text-gray-600">Local Database</span>
              {databaseStatus === 'connected' ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Active
                </span>
              ) : (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  Disconnected
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm text-gray-600">PDF Generator</span>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm text-gray-600">Email System</span>
              {emailConfig?.isConfigured ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Configured
                </span>
              ) : (
                <span className="text-xs text-yellow-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  Not Configured
                </span>
              )}
            </div>
          </div>
          
          {/* Configuration Help */}
          {(!sharePointConfig?.isConfigured || !emailConfig?.isConfigured) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 mb-2">
                <strong>Configuration Required:</strong>
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                {!sharePointConfig?.isConfigured && (
                  <li>• Configure SharePoint API in Settings for MTR fetching</li>
                )}
                {!emailConfig?.isConfigured && (
                  <li>• Configure Email System in Settings for notifications</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}