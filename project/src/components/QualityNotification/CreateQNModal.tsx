import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';

interface CreateQNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (qnData: any) => void;
}

export function CreateQNModal({ isOpen, onClose, onSubmit }: CreateQNModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'process',
    job_id: '',
    job_number: '',
    serial_number: '',
    batch_number: '',
    part_number: '',
    customer_po: '',
    work_order: '',
    machine_id: '',
    operator_id: '',
    shift: '',
    production_line: '',
    material_lot: '',
    inspection_stage: '',
    defect_location: '',
    quantity_affected: '',
    root_cause_category: '',
    assigned_to: []
  });
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch jobs and users for dropdowns  
      const fetchData = async () => {
        const allJobs = await dataService.getJobs();
        const allUsers = await dataService.getUsers();
        setJobs(allJobs.filter(job => job.status === 'active'));
        setUsers(allUsers.filter(u => ['admin', 'inspector', 'manager', 'engineer'].includes(u.role)));
      };
      fetchData();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill job number when job is selected
    if (field === 'job_id') {
      const selectedJob = jobs.find((job: any) => job.id === value);
      setFormData(prev => ({ 
        ...prev, 
        job_id: value,
        job_number: selectedJob ? selectedJob.job_number : ''
      }));
    }
  };

  const handleUserSelection = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(userId)
        ? prev.assigned_to.filter(id => id !== userId)
        : [...prev.assigned_to, userId]
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => ({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      setAttachedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (imageId: number) => {
    setAttachedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        attachedImages: attachedImages
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'process',
        job_id: '',
        job_number: '',
        assigned_to: []
      });
      setAttachedImages([]);
    } catch (error) {
      console.error('Error creating QN:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Raise Quality Notification</h2>
              <p className="text-sm text-gray-600 mt-1">
                Report quality issues that need attention
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
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief description of the quality issue"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="material">Material</option>
                <option value="process">Process</option>
                <option value="equipment">Equipment</option>
                <option value="documentation">Documentation</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Job (Optional)
              </label>
              <select
                value={formData.job_id}
                onChange={(e) => handleInputChange('job_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a job...</option>
                {jobs.map((job: any) => (
                  <option key={job.id} value={job.id}>
                    {job.job_number} - {job.product_type}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturing Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Manufacturing Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                placeholder="e.g., SN2025010001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch/Lot Number
              </label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => handleInputChange('batch_number', e.target.value)}
                placeholder="e.g., BATCH-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Number
              </label>
              <input
                type="text"
                value={formData.part_number}
                onChange={(e) => handleInputChange('part_number', e.target.value)}
                placeholder="e.g., CP-CAP-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer PO
              </label>
              <input
                type="text"
                value={formData.customer_po}
                onChange={(e) => handleInputChange('customer_po', e.target.value)}
                placeholder="e.g., PO-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Order
              </label>
              <input
                type="text"
                value={formData.work_order}
                onChange={(e) => handleInputChange('work_order', e.target.value)}
                placeholder="e.g., WO-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine ID
              </label>
              <input
                type="text"
                value={formData.machine_id}
                onChange={(e) => handleInputChange('machine_id', e.target.value)}
                placeholder="e.g., PERF-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator ID
              </label>
              <input
                type="text"
                value={formData.operator_id}
                onChange={(e) => handleInputChange('operator_id', e.target.value)}
                placeholder="e.g., OP-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift
              </label>
              <select
                value={formData.shift}
                onChange={(e) => handleInputChange('shift', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select shift</option>
                <option value="day">Day Shift (6AM - 2PM)</option>
                <option value="evening">Evening Shift (2PM - 10PM)</option>
                <option value="night">Night Shift (10PM - 6AM)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Line
              </label>
              <select
                value={formData.production_line}
                onChange={(e) => handleInputChange('production_line', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select production line</option>
                <option value="line_a">Production Line A</option>
                <option value="line_b">Production Line B</option>
                <option value="line_c">Production Line C</option>
                <option value="assembly">Assembly Line</option>
                <option value="testing">Testing Line</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Lot
              </label>
              <input
                type="text"
                value={formData.material_lot}
                onChange={(e) => handleInputChange('material_lot', e.target.value)}
                placeholder="e.g., MAT-LOT-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Stage
              </label>
              <select
                value={formData.inspection_stage}
                onChange={(e) => handleInputChange('inspection_stage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select inspection stage</option>
                <option value="incoming">Incoming Inspection</option>
                <option value="in_process">In-Process Inspection</option>
                <option value="final">Final Inspection</option>
                <option value="pre_shipment">Pre-Shipment Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Defect Location
              </label>
              <input
                type="text"
                value={formData.defect_location}
                onChange={(e) => handleInputChange('defect_location', e.target.value)}
                placeholder="e.g., Base pipe section 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Affected
              </label>
              <input
                type="number"
                value={formData.quantity_affected}
                onChange={(e) => handleInputChange('quantity_affected', e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Root Cause Category
              </label>
              <select
                value={formData.root_cause_category}
                onChange={(e) => handleInputChange('root_cause_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select root cause category</option>
                <option value="material">Material Defect</option>
                <option value="machine">Machine/Equipment Issue</option>
                <option value="method">Process/Method Issue</option>
                <option value="manpower">Human Error</option>
                <option value="measurement">Measurement/Calibration</option>
                <option value="environment">Environmental Factor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To (Select multiple users)
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                {users.map((user: any) => (
                  <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                    <input
                      type="checkbox"
                      checked={formData.assigned_to.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm">{user.full_name} ({user.role})</span>
                  </label>
                ))}
              </div>
              {formData.assigned_to.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.assigned_to.length} user(s) selected
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the quality issue, including steps to reproduce, expected vs actual results, and any relevant observations..."
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Images (Optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {attachedImages.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {attachedImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{image.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Quality Notification Guidelines:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Provide clear, specific details about the quality issue</li>
              <li>• Include job number if the issue is related to a specific manufacturing job</li>
              <li>• Set appropriate priority based on impact to production and quality</li>
              <li>• Select multiple assignees to notify relevant team members</li>
              <li>• Attach images if they help illustrate the quality issue</li>
            </ul>
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            Raised by: {user?.full_name} ({user?.role})
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Raising QN...' : 'Raise QN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}