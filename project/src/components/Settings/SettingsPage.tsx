import React, { useState } from 'react';
import { Settings, Key, Save, TestTube, CheckCircle, AlertCircle, Shield, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SharePointConfigModal, SharePointConfig } from '../Dossier/SharePointConfigModal';
import { EmailConfigModal, EmailConfig } from './EmailConfigModal';
import { dataService } from '../../lib/dataService';

export function SettingsPage() {
  const { user } = useAuth();
  const [sharePointModal, setSharePointModal] = useState(false);
  const [sharePointConfig, setSharePointConfig] = useState<SharePointConfig | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  // Load settings on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await dataService.getSettings();
        if (settings.sharepoint_config) {
          setSharePointConfig(settings.sharepoint_config);
        }
        if (settings.email_config) {
          setEmailConfig(settings.email_config);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSharePointConfigSave = (config: SharePointConfig) => {
    setSharePointConfig(config);
    console.log('✅ SharePoint configuration saved to backend');
  };

  const handleEmailConfigSave = (config: EmailConfig) => {
    setEmailConfig(config);
    console.log('✅ Email configuration saved to backend');
  };
  // Only allow admin access
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure system integrations and administrative settings
          </p>
        </div>

        {/* Integration Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Integration Settings</h2>
              <p className="text-gray-600 text-sm">Configure external system integrations</p>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email Configuration</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Configure SMTP settings for Quality Notification email alerts
                </p>
                
                {emailConfig?.isConfigured ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">Email System Configured</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>SMTP Host: {emailConfig.smtpHost}</div>
                      <div>From Email: {emailConfig.fromEmail}</div>
                      <div>From Name: {emailConfig.fromName}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">Email System Not Configured</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {emailConfig?.isConfigured ? 'Update Config' : 'Configure'}
              </button>
            </div>
          </div>
          {/* SharePoint Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">SharePoint API Configuration</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Configure SharePoint API access for automatic MTR certificate fetching in dossier generation
                </p>
                
                {sharePointConfig?.isConfigured ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">SharePoint API Configured</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Site: {sharePointConfig.siteUrl}</div>
                      <div>Library: {sharePointConfig.libraryName}</div>
                      <div>Client ID: {sharePointConfig.clientId.substring(0, 8)}...</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">SharePoint API Not Configured</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setSharePointModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                {sharePointConfig?.isConfigured ? 'Update Config' : 'Configure'}
              </button>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
              <p className="text-gray-600 text-sm">Current system configuration and status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Application</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Version: 1.0.0</div>
                  <div>Environment: {import.meta.env.MODE === 'development' ? 'Development' : 'Production'}</div>
                  <div>Last Updated: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                  <div>Build Time: {new Date().toLocaleTimeString()}</div>
                  <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Database</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Local Storage: {localStorage.length} items stored</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sharePointConfig?.isConfigured ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-600" />
                    )}
                    <span>SharePoint Sync: {sharePointConfig?.isConfigured ? 'Enabled' : 'Not Configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {emailConfig?.isConfigured ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-600" />
                    )}
                    <span>Email System: {emailConfig?.isConfigured ? 'Configured' : 'Not Configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Jobs: {localStorageAPI.getJobs().length} total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Users: {localStorageAPI.getUsers().length} registered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live System Status */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Live System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">System Online</span>
                </div>
                <div className="text-xs text-green-600">
                  Uptime: {Math.floor(performance.now() / 1000 / 60)} minutes
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Data Storage</span>
                </div>
                <div className="text-xs text-blue-600">
                  {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB used
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Active Session</span>
                </div>
                <div className="text-xs text-purple-600">
                  User: {user?.full_name} ({user?.role})
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Email Configuration Modal */}
      <EmailConfigModal
        isOpen={emailModal}
        onClose={() => setEmailModal(false)}
        onSave={handleEmailConfigSave}
      />
      {/* SharePoint Configuration Modal */}
      <SharePointConfigModal
        isOpen={sharePointModal}
        onClose={() => setSharePointModal(false)}
        onSave={handleSharePointConfigSave}
      />
    </>
  );
}