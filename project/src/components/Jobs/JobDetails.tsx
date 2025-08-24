import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Save, 
  Download,
  User,
  Calendar,
  Package
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { generateJobPDF } from '../../utils/pdfGenerator';

export function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [stepData, setStepData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      // Fetch job details
      const jobData = await dataService.getJobById(id!);
      if (!jobData) throw new Error('Job not found');
      
      const users = await dataService.getUsers();
      const jobWithUsers = {
        ...jobData,
        created_by: users.find(u => u.id === jobData.created_by),
        assigned_to: jobData.assigned_to ? users.find(u => u.id === jobData.assigned_to) : null
      };
      setJob(jobWithUsers);

      // Fetch job steps
      const stepsData = (await dataService.getJobSteps(id!))
        .sort((a, b) => a.step_number - b.step_number);
      setSteps(stepsData);

      // Find current active step
      const currentStepIndex = stepsData?.findIndex(step => !step.completed_at) ?? 0;
      setActiveStep(currentStepIndex);

      // Initialize step data
      const initialData = stepsData?.reduce((acc: any, step: any) => {
        acc[step.step_number] = step.data || {};
        return acc;
      }, {}) || {};
      setStepData(initialData);

    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStepData = async (stepNumber: number, data: any, markComplete = false) => {
    setSaving(true);
    try {
      const updates: any = { data };
      
      if (markComplete) {
        updates.completed_by = user?.id;
        updates.completed_at = new Date().toISOString();
      }

      const updatedStep = await dataService.updateJobStep(id!, stepNumber, updates);
      if (!updatedStep) throw new Error('Failed to update step');

      // Update local state
      setSteps(prev => prev.map(step => 
        step.step_number === stepNumber 
          ? { ...step, ...updates }
          : step
      ));

      if (markComplete && stepNumber < steps.length) {
        setActiveStep(stepNumber);
      } else if (markComplete && stepNumber === steps.length) {
        // All steps completed, mark job as complete
        await completeJob();
      }

    } catch (error) {
      console.error('Error saving step data:', error);
    } finally {
      setSaving(false);
    }
  };

  const completeJob = async () => {
    try {
      const updatedJob = await dataService.updateJob(id!, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      
      if (!updatedJob) throw new Error('Failed to complete job');

      // Generate PDF report
      await generatePDFReport();
      
      setJob((prev: any) => ({ ...prev, status: 'completed', completed_at: new Date().toISOString() }));
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const generatePDFReport = async () => {
    try {
      const pdfBlob = await generateJobPDF(job, steps);
      const fileName = `${job.job_number}_report.pdf`;
      
      // Save report reference
      await dataService.createPDFReport({
        job_id: job.id,
        file_name: fileName,
        generated_by: user?.id || '',
        generated_at: new Date().toISOString(),
      });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const renderStepForm = (step: any) => {
    const currentData = stepData[step.step_number] || {};

    // Example form for Capture product type
    if (job.product_type === 'Capture') {
      switch (step.step_name) {
        case 'Setup':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment ID
                </label>
                <input
                  type="text"
                  value={currentData.equipment_id || ''}
                  onChange={(e) => setStepData(prev => ({
                    ...prev,
                    [step.step_number]: { ...currentData, equipment_id: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Notes
                </label>
                <textarea
                  value={currentData.notes || ''}
                  onChange={(e) => setStepData(prev => ({
                    ...prev,
                    [step.step_number]: { ...currentData, notes: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );
        case 'Configuration':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Settings
                </label>
                <textarea
                  value={currentData.settings || ''}
                  onChange={(e) => setStepData(prev => ({
                    ...prev,
                    [step.step_number]: { ...currentData, settings: e.target.value }
                  }))}
                  rows={4}
                  placeholder="Enter configuration parameters..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Rate (Hz)
                  </label>
                  <input
                    type="number"
                    value={currentData.sample_rate || ''}
                    onChange={(e) => setStepData(prev => ({
                      ...prev,
                      [step.step_number]: { ...currentData, sample_rate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={currentData.duration || ''}
                    onChange={(e) => setStepData(prev => ({
                      ...prev,
                      [step.step_number]: { ...currentData, duration: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Step Notes
                </label>
                <textarea
                  value={currentData.notes || ''}
                  onChange={(e) => setStepData(prev => ({
                    ...prev,
                    [step.step_number]: { ...currentData, notes: e.target.value }
                  }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );
      }
    }

    // Generic form for other product types
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step Notes
          </label>
          <textarea
            value={currentData.notes || ''}
            onChange={(e) => setStepData(prev => ({
              ...prev,
              [step.step_number]: { ...currentData, notes: e.target.value }
            }))}
            rows={4}
            placeholder={`Enter details for ${step.step_name}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality Check
          </label>
          <select
            value={currentData.quality_check || ''}
            onChange={(e) => setStepData(prev => ({
              ...prev,
              [step.step_number]: { ...currentData, quality_check: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select status</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentStep = steps[activeStep];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{job.job_number}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{job.product_type}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{job.assigned_to?.full_name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Started {format(new Date(job.started_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        {job.status === 'completed' && (
          <button
            onClick={generatePDFReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Progress */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Steps</h2>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === activeStep
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : step.completed_at
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.completed_at
                        ? 'bg-green-600 text-white'
                        : index === activeStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.completed_at ? <CheckCircle className="w-4 h-4" /> : step.step_number}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{step.step_name}</p>
                      {step.completed_at && (
                        <p className="text-xs text-gray-500">
                          Completed {formatDistanceToNow(new Date(step.completed_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Form */}
        <div className="lg:col-span-2">
          {currentStep && job.status !== 'completed' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentStep.step_name}</h2>
                  <p className="text-gray-600">Step {currentStep.step_number} of {steps.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  {currentStep.completed_at ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {renderStepForm(currentStep)}

              <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => saveStepData(currentStep.step_number, stepData[currentStep.step_number])}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Progress'}
                </button>
                
                {!currentStep.completed_at && (
                  <button
                    onClick={() => saveStepData(currentStep.step_number, stepData[currentStep.step_number], true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Step
                  </button>
                )}
              </div>
            </div>
          )}

          {job.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Completed</h2>
              <p className="text-gray-600 mb-4">
                This job was completed on {format(new Date(job.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
              <button
                onClick={generatePDFReport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}