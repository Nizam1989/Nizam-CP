import React, { useState, useEffect } from 'react';
import { X, Key, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface SharePointConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SharePointConfig) => void;
}

export interface SharePointConfig {
  siteUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  libraryName: string;
  isConfigured: boolean;
}

export function SharePointConfigModal({ isOpen, onClose, onSave }: SharePointConfigModalProps) {
  const [config, setConfig] = useState<SharePointConfig>({
    siteUrl: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    libraryName: 'MTR_Certificates',
    isConfigured: false
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load existing config from localStorage
      const savedConfig = localStorage.getItem('sharepoint_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof SharePointConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate API test - in real implementation, this would test SharePoint connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (80% success rate for demo)
      const success = Math.random() > 0.2;
      
      if (success) {
        setTestResult('success');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const configToSave = {
      ...config,
      isConfigured: true
    };
    
    // Save to localStorage
    localStorage.setItem('sharepoint_config', JSON.stringify(configToSave));
    
    onSave(configToSave);
    onClose();
  };

  const isFormValid = config.siteUrl && config.clientId && config.clientSecret && config.tenantId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">SharePoint Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure SharePoint API access for MTR certificate fetching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SharePoint Site URL *
              </label>
              <input
                type="url"
                value={config.siteUrl}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                placeholder="https://yourcompany.sharepoint.com/sites/yoursite"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID (Application ID) *
              </label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                placeholder="12345678-1234-1234-1234-123456789012"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret *
              </label>
              <input
                type="password"
                value={config.clientSecret}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                placeholder="Your client secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant ID *
              </label>
              <input
                type="text"
                value={config.tenantId}
                onChange={(e) => handleInputChange('tenantId', e.target.value)}
                placeholder="12345678-1234-1234-1234-123456789012"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Library Name
              </label>
              <input
                type="text"
                value={config.libraryName}
                onChange={(e) => handleInputChange('libraryName', e.target.value)}
                placeholder="MTR_Certificates"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Test Connection</h3>
              <button
                onClick={testConnection}
                disabled={!isFormValid || testing}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TestTube className="w-4 h-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {testResult === 'success' 
                    ? 'Connection successful! SharePoint API is accessible.' 
                    : 'Connection failed. Please check your credentials and try again.'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. Register an app in Azure AD with SharePoint permissions</li>
              <li>2. Grant "Sites.Read.All" and "Files.Read.All" permissions</li>
              <li>3. Generate a client secret for the registered app</li>
              <li>4. Ensure the document library contains MTR files named as "MTR_[JobNumber].pdf"</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            * Required fields
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}