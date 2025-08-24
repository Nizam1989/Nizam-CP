import React, { useState, useEffect } from 'react';
import { X, Mail, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: EmailConfig) => void;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
}

export function EmailConfigModal({ isOpen, onClose, onSave }: EmailConfigModalProps) {
  const [config, setConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Completion Products Quality System',
    isConfigured: false
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load existing config from localStorage
      const savedConfig = localStorage.getItem('email_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof EmailConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const testEmailConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate email test - in real implementation, this would test SMTP connection
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
    localStorage.setItem('email_config', JSON.stringify(configToSave));
    
    onSave(configToSave);
    onClose();
  };

  const isFormValid = config.smtpHost && config.smtpUser && config.smtpPassword && config.fromEmail;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure SMTP settings for Quality Notification emails
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={config.smtpHost}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port *
                </label>
                <input
                  type="text"
                  value={config.smtpPort}
                  onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                  placeholder="587"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username *
              </label>
              <input
                type="text"
                value={config.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                placeholder="your-email@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password *
              </label>
              <input
                type="password"
                value={config.smtpPassword}
                onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                placeholder="Your SMTP password or app password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email *
              </label>
              <input
                type="email"
                value={config.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder="quality@completionproducts.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={config.fromName}
                onChange={(e) => handleInputChange('fromName', e.target.value)}
                placeholder="Completion Products Quality System"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Test Connection */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Test Email Connection</h3>
              <button
                onClick={testEmailConnection}
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
                    ? 'Email connection successful! SMTP settings are working.' 
                    : 'Email connection failed. Please check your SMTP settings.'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Email Setup Instructions:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. Use your company's SMTP server settings</li>
              <li>2. For Gmail: Enable 2FA and use App Password instead of regular password</li>
              <li>3. For Office 365: Use smtp-mail.outlook.com with port 587</li>
              <li>4. Test the connection before saving to ensure emails will be delivered</li>
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