import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Wifi,
  WifiOff,
  FileText
} from 'lucide-react';
import { api, type Job } from '../../lib/api';
import { useRealTimeUpdates, useRealTimeNotifications } from '../../hooks/useRealTimeUpdates';

interface ManufacturingDashboardProps {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

export const ManufacturingDashboard: React.FC<ManufacturingDashboardProps> = ({
  user = { 
    id: 'sandscreencp@outlook.com', 
    role: 'super_admin', 
    name: 'System Administrator' 
  }
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  // Real-time notifications
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    handleSystemUpdate 
  } = useRealTimeNotifications();

  // Real-time updates
  const { 
    isConnected, 
    connectionStatus, 
    lastUpdateTime,
    manualRefresh 
  } = useRealTimeUpdates({
    enabled: true,
    pollInterval: 5000, // 5 seconds
    onUpdate: (update) => {
      console.log('Received update:', update);
      handleSystemUpdate(update);
      
      // Refresh jobs list when there are job-related updates
      if (update.entityType === 'job') {
        loadJobs();
      }
    }
  });

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const response = await api.getJobs();
      
      if (response.success && response.data) {
        setJobs(response.data);
        setLastRefresh(format(new Date(), 'HH:mm:ss'));
      } else {
        setError(response.error || 'Failed to load jobs');
        addNotification({
          message: 'Failed to load jobs',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
      addNotification({
        message: 'Failed to load jobs',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Initialize database and load jobs on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database schema
        const initResponse = await api.initializeDatabase();
        if (initResponse.success) {
          console.log('Database initialized successfully');
        }
        
        // Load jobs
        await loadJobs();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to initialize application');
      }
    };

    initializeApp();
  }, [loadJobs]);

  const handleCreateJob = async () => {
    try {
      const jobNumber = `JOB-${Date.now()}`;
      const response = await api.createJob({
        jobNumber,
        title: `Manufacturing Job ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        productType: 'Widget',
        createdBy: user.id,
        totalStages: 5
      });

      if (response.success) {
        addNotification({
          message: `Job ${jobNumber} created successfully`,
          type: 'success'
        });
        // Jobs will be updated via real-time updates
      } else {
        addNotification({
          message: response.error || 'Failed to create job',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      addNotification({
        message: 'Failed to create job',
        type: 'error'
      });
    }
  };

  const handleCompleteStep = async (job: Job) => {
    try {
      const response = await api.updateStep({
        jobId: job.id,
        stepNumber: 1, // Complete first step
        status: 'completed',
        completedBy: user.id
      });

      if (response.success) {
        addNotification({
          message: `Step completed for job ${job.jobNumber}`,
          type: 'success'
        });
        // Jobs will be updated via real-time updates
      } else {
        addNotification({
          message: response.error || 'Failed to update step',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating step:', error);
      addNotification({
        message: 'Failed to update step',
        type: 'error'
      });
    }
  };

  const handleGeneratePDF = async (job: Job) => {
    try {
      const response = await api.generatePDF({
        jobId: job.id,
        templateType: 'quality-inspection',
        formData: {
          inspector: user.name,
          inspectionDate: new Date().toISOString(),
          qualityScore: '95%',
          notes: 'Quality inspection completed successfully'
        }
      });

      if (response.success) {
        addNotification({
          message: `PDF generated for job ${job.jobNumber}`,
          type: 'success'
        });
      } else {
        addNotification({
          message: response.error || 'Failed to generate PDF',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({
        message: 'Failed to generate PDF',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on_hold': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Manufacturing Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                {user.role} | {user.name}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Last Update */}
              {lastUpdateTime && (
                <div className="text-sm text-gray-500">
                  Last update: {format(new Date(lastUpdateTime), 'HH:mm:ss')}
                </div>
              )}

              {/* Manual Refresh */}
              <button
                onClick={() => {
                  manualRefresh();
                  loadJobs();
                }}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} relative`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs mt-1 opacity-75">
                  {format(new Date(notification.timestamp), 'HH:mm:ss')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Manufacturing Jobs</h2>
              <p className="text-sm text-gray-500">
                {jobs.length} jobs total • Last refresh: {lastRefresh || 'Never'}
              </p>
            </div>
            
            <button
              onClick={handleCreateJob}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <>
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.jobNumber}</p>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span>{job.status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Product Type:</span>
                        <span className="font-medium">{job.productType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stage:</span>
                        <span className="font-medium">{job.currentStage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="font-medium">
                          {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      {job.progress && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Progress:</span>
                          <span className="font-medium">
                            {job.progress.completed}/{job.progress.total} steps
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {job.progress && (
                      <div className="mb-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(job.progress.completed / job.progress.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCompleteStep(job)}
                        disabled={job.status === 'completed'}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete Step</span>
                      </button>
                      <button
                        onClick={() => handleGeneratePDF(job)}
                        className="flex items-center justify-center px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No manufacturing jobs</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first manufacturing job.</p>
                <button
                  onClick={handleCreateJob}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Job</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};