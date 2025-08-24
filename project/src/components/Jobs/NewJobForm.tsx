import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';

const productTypes = [
  {
    name: 'Capture',
    description: 'Sand screen manufacturing process',
    stages: [
      'Incoming Inspection',
      'Basepipe perforation',
      'Base pipe perforation verification', 
      'Base pipe deburring',
      'Base pipe deburring and drifting inspection',
      'Manufacturing wire wrap screen',
      'Screen camera inspection',
      'Welding process',
      'Heat treatment process (if any)',
      'Liquid dye penetrant',
      'Final inspection',
      'Cleaning and packing'
    ],
    color: 'purple',
  },
  {
    name: 'Endure',
    description: 'Durability and stress testing procedures',
    stages: ['Preparation', 'Initial Testing', 'Stress Testing', 'Analysis', 'Final Report'],
    color: 'orange',
  },
  {
    name: 'Assure',
    description: 'Quality assurance and verification',
    stages: ['Planning', 'Inspection', 'Testing', 'Review', 'Certification'],
    color: 'green',
  },
  {
    name: 'Secure',
    description: 'Security testing and validation',
    stages: ['Assessment', 'Testing', 'Vulnerability Analysis', 'Remediation', 'Verification'],
    color: 'red',
  },
  {
    name: 'Prepack',
    description: 'Pre-packaging and preparation',
    stages: ['Material Prep', 'Packaging Setup', 'Quality Check', 'Labeling', 'Final Inspection'],
    color: 'blue',
  },
  {
    name: 'Custom Job',
    description: 'Create a custom manufacturing process',
    stages: ['Custom Step 1', 'Custom Step 2', 'Custom Step 3'],
    color: 'gray',
  },
];

export function NewJobForm() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const generateJobNumber = () => {
    const prefix = selectedProduct.substring(0, 3).toUpperCase();
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setJobNumber(`${prefix}-${dateStr}-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !jobNumber || !user) return;

    setLoading(true);
    setError('');

    try {
      const productType = productTypes.find(p => p.name === selectedProduct);
      if (!productType) throw new Error('Invalid product type');

      // Create the job
      const job = await dataService.createJob({
        job_number: jobNumber,
        product_type: selectedProduct as any,
        status: 'active',
        current_stage: productType.stages[0],
        total_stages: productType.stages.length,
        created_by: user.id,
        assigned_to: user.id,
        started_at: new Date().toISOString(),
        completed_at: null,
      });

      // Create initial job steps
      const steps = productType.stages.map((stage, index) => ({
        job_id: job.id,
        step_number: index + 1,
        step_name: stage,
        data: {},
      }));

      await dataService.createJobSteps(steps);

      navigate(`/jobs/${job.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      purple: selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
      orange: selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300',
      green: selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
      red: selected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300',
      blue: selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
      gray: selected ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:border-gray-300',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section - Responsive */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Job</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Select a product type and configure your manufacturing job
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Product Type Selection - Responsive Grid */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Select Product Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {productTypes.map((product) => (
              <div
                key={product.name}
                onClick={() => setSelectedProduct(product.name)}
                className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-200 ${getColorClasses(
                  product.color,
                  selectedProduct === product.name
                )} hover:shadow-md`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {product.description}
                </p>
                
                {/* Show stages count */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {product.stages.length} stages
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Configuration - Responsive */}
        {selectedProduct && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Job Configuration
            </h2>
            
            {/* Responsive Grid for form fields */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-6">
              {/* Job Number Field */}
              <div className="space-y-2">
                <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700">
                  Job Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="jobNumber"
                    type="text"
                    value={jobNumber}
                    onChange={(e) => setJobNumber(e.target.value)}
                    placeholder="Enter job number or generate"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={generateJobNumber}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Selected Product Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selected Product
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm">
                  {selectedProduct}
                </div>
              </div>
            </div>

            {/* Manufacturing Process Preview - Mobile Friendly */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Manufacturing Process</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Total Steps:</span> {productTypes.find(p => p.name === selectedProduct)?.stages.length}
                  </div>
                  <div>
                    <span className="font-medium">First Step:</span> {productTypes.find(p => p.name === selectedProduct)?.stages[0]}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Assigned to:</span> {user?.full_name || 'Current User'}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Start Date:</span> {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - Responsive */}
        {selectedProduct && jobNumber && (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium order-1 sm:order-2"
            >
              {loading ? 'Creating Job...' : 'Create Job'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}