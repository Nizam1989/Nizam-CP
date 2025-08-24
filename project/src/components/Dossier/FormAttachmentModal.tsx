import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';

interface FormAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentName: string;
  onAttach: (componentId: string, data: any) => void;
}

export function FormAttachmentModal({ 
  isOpen, 
  onClose, 
  componentId, 
  componentName, 
  onAttach 
}: FormAttachmentModalProps) {
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableForms();
    }
  }, [isOpen]);

  const fetchAvailableForms = async () => {
    setLoading(true);
    try {
      // Get all jobs and their steps
      const jobs = dataService.getJobs();
      const users = dataService.getUsers();
      
      const formsData = [];
      
      for (const job of jobs) {
        const steps = dataService.getJobSteps(job.id);
        const completedSteps = steps.filter(step => step.completed_at);
        
        for (const step of completedSteps) {
          const assignedUser = users.find(u => u.id === step.completed_by);
          formsData.push({
            id: `${job.id}-${step.id}`,
            jobNumber: job.job_number,
            productType: job.product_type,
            stepName: step.step_name,
            stepNumber: step.step_number,
            completedAt: step.completed_at,
            completedBy: assignedUser?.full_name || 'Unknown',
            data: step.data,
            formType: getFormType(step.step_name)
          });
        }
      }
      
      setAvailableForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormType = (stepName: string) => {
    if (stepName.toLowerCase().includes('perforation')) return 'Base Pipe Perforation';
    if (stepName.toLowerCase().includes('verification')) return 'Base Pipe Verification';
    if (stepName.toLowerCase().includes('deburring')) return 'Deburring';
    if (stepName.toLowerCase().includes('inspection')) return 'Inspection';
    if (stepName.toLowerCase().includes('welding')) return 'Welding';
    if (stepName.toLowerCase().includes('heat treatment')) return 'Heat Treatment';
    if (stepName.toLowerCase().includes('dye penetrant')) return 'Liquid Dye Penetrant';
    return 'Manufacturing Form';
  };

  const filteredForms = availableForms.filter(form =>
    form.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.stepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.formType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormToggle = (formId: string) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleAttach = () => {
    const selectedFormData = availableForms.filter(form => 
      selectedForms.includes(form.id)
    );
    
    onAttach(componentId, {
      type: 'internal_forms',
      forms: selectedFormData,
      attachedAt: new Date().toISOString(),
      count: selectedFormData.length
    });
    
    onClose();
    setSelectedForms([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Attach Forms</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select forms to attach to: <span className="font-medium">{componentName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search by job number, step name, or form type..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Forms List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredForms.length > 0 ? (
            <div className="space-y-3">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => handleFormToggle(form.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedForms.includes(form.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-5 bg-blue-600 rounded" />
                        <h3 className="font-medium text-gray-900">{form.formType}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Step {form.stepNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Job:</span> {form.jobNumber}
                        </div>
                        <div>
                          <span className="font-medium">Product:</span> {form.productType}
                        </div>
                        <div>
                          <span className="font-medium">Step:</span> {form.stepName}
                        </div>
                        <div>
                          <span className="font-medium">Completed by:</span> {form.completedBy}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Completed: {new Date(form.completedAt).toLocaleDateString()} at {new Date(form.completedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    {selectedForms.includes(form.id) && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-400 rounded mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No forms match your search criteria.' : 'No completed forms available to attach.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedForms.length} form{selectedForms.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAttach}
              disabled={selectedForms.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Attach Selected ({selectedForms.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}