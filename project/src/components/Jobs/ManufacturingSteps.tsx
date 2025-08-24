import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Play, User, Calendar } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { StepForm } from './StepForm';
import { format } from 'date-fns';

export function ManufacturingSteps() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchJobDetails();
    }
  }, [id, user]);

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

    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step: any) => {
    setSelectedStep(step);
  };

  const handleStepUpdate = async (updatedStep: any) => {
    setSteps(prev => prev.map(step => 
      step.id === updatedStep.id ? updatedStep : step
    ));
    
    // Update job progress if step was completed
    if (updatedStep.completed_at && !steps.find(s => s.id === updatedStep.id)?.completed_at) {
      const completedSteps = steps.filter(s => s.completed_at || s.id === updatedStep.id).length;
      const currentStageNumber = Math.min(completedSteps + 1, steps.length);
      const currentStage = steps[currentStageNumber - 1]?.step_name || 'Completed';
      
      await dataService.updateJob(id!, { current_stage: currentStage });
      
      setJob((prev: any) => ({ ...prev, current_stage: currentStage }));
    }
  };

  const getStepStatus = (step: any) => {
    if (step.completed_at) return 'completed';
    if (step.skipped_at) return 'skipped';
    return 'available';
  };

  const getStepIcon = (step: any) => {
    const status = getStepStatus(step);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'skipped':
        return <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>;
      default:
        return <Play className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStepStyles = (step: any) => {
    const status = getStepStatus(step);
    
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'skipped':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      default:
        return 'bg-white border-blue-200 hover:bg-blue-50 cursor-pointer';
    }
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

  if (selectedStep) {
    return (
      <StepForm
        step={selectedStep}
        job={job}
        onBack={() => setSelectedStep(null)}
        onUpdate={handleStepUpdate}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
            <span className="font-medium">{job.product_type} Manufacturing Process</span>
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
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Manufacturing Progress</h2>
          <div className="text-sm text-gray-600">
            {steps.filter(s => s.completed_at).length} of {steps.length} steps completed
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${(steps.filter(s => s.completed_at).length / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Manufacturing Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Manufacturing Steps</h2>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const isClickable = true;
            
            return (
              <div
                key={step.id}
                onClick={() => isClickable && handleStepClick(step)}
                className={`border-2 rounded-lg p-4 transition-all duration-200 ${getStepStyles(step)}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        Step {step.step_number}
                      </span>
                      {step.completed_at && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      {status === 'available' && !step.completed_at && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {step.step_name}
                    </h3>
                    {step.completed_at && (
                      <p className="text-sm text-gray-600">
                        Completed on {format(new Date(step.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                    {step.skipped_at && (
                      <p className="text-sm text-gray-600">
                        Skipped on {format(new Date(step.skipped_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                    {step.skipped_at && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        Skipped
                      </span>
                    )}
                    {status === 'available' && !step.completed_at && (
                      <p className="text-sm text-blue-600 font-medium">
                        Click to work on this step
                      </p>
                    )}
                  </div>
                  {isClickable && (
                    <div className="flex-shrink-0">
                      <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}