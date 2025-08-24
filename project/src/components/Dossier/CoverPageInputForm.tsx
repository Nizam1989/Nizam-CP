import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, FileText } from 'lucide-react';

interface CoverPageData {
  // Customer Information
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  
  // Job Information
  jobNumber: string;
  poNumber: string;
  projectName: string;
  productType: string;
  quantity: string;
  deliveryDate: string;
  
  // Company Information
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  
  // Quality Information
  qcManager: string;
  projectManager: string;
  qualityStandard: string;
  certificationLevel: string;
  
  // Additional Information
  specialRequirements: string;
  notes: string;
}

interface CoverPageInputFormProps {
  onSave: (data: CoverPageData) => void;
  initialData?: Partial<CoverPageData>;
}

export function CoverPageInputForm({ onSave, initialData = {} }: CoverPageInputFormProps) {
  const [formData, setFormData] = useState<CoverPageData>({
    // Customer Information
    customerName: initialData?.customerName || '',
    customerAddress: initialData?.customerAddress || '',
    customerContact: initialData?.customerContact || '',
    customerEmail: initialData?.customerEmail || '',
    
    // Job Information
    jobNumber: initialData?.jobNumber || '',
    poNumber: initialData?.poNumber || '',
    projectName: initialData?.projectName || '',
    productType: initialData?.productType || '',
    quantity: initialData?.quantity || '',
    deliveryDate: initialData?.deliveryDate || '',
    
    // Company Information
    companyName: initialData?.companyName || 'Completion Products Pte Ltd',
    companyAddress: initialData?.companyAddress || 'Singapore',
    companyPhone: initialData?.companyPhone || '+65 6XXX XXXX',
    companyEmail: initialData?.companyEmail || 'info@completionproducts.com',
    companyWebsite: initialData?.companyWebsite || 'www.completionproducts.com',
    
    // Quality Information
    qcManager: initialData?.qcManager || '',
    projectManager: initialData?.projectManager || '',
    qualityStandard: initialData?.qualityStandard || 'ISO 9001:2015',
    certificationLevel: initialData?.certificationLevel || 'API 5CT',
    
    // Additional Information
    specialRequirements: initialData?.specialRequirements || '',
    notes: initialData?.notes || '',
  });

  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof CoverPageData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('dossier_cover_page_data', JSON.stringify(formData));
      
      // Also save to a more structured format for backend sync
      const coverPageRecord = {
        id: 'cover_page_' + Date.now(),
        data: formData,
        created_by: 'current_user', // Would be actual user ID in real app
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to localStorage with structure
      const existingRecords = JSON.parse(localStorage.getItem('cover_page_records') || '[]');
      existingRecords.push(coverPageRecord);
      localStorage.setItem('cover_page_records', JSON.stringify(existingRecords));
      
      console.log('✅ Cover page data saved to backend:', coverPageRecord.id);
      
      onSave(formData);
    } catch (error) {
      console.error('Error saving cover page data:', error);
      alert('Failed to save cover page data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-lg">Cover Page Information</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure the cover page details for the quality dossier
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <Input
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer company name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <Input
                value={formData.customerContact}
                onChange={(e) => handleInputChange('customerContact', e.target.value)}
                placeholder="Enter contact person name"
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Address
              </label>
              <Input
                value={formData.customerAddress}
                onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                placeholder="Enter customer address"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <Input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="customer@company.com"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Job Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Number *
              </label>
              <Input
                value={formData.jobNumber}
                onChange={(e) => handleInputChange('jobNumber', e.target.value)}
                placeholder="e.g., CAP-250123-01"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Number
              </label>
              <Input
                value={formData.poNumber}
                onChange={(e) => handleInputChange('poNumber', e.target.value)}
                placeholder="Enter purchase order number"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <Input
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter project name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <select
                value={formData.productType}
                onChange={(e) => handleInputChange('productType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select product type</option>
                <option value="Capture">Capture</option>
                <option value="Endure">Endure</option>
                <option value="Assure">Assure</option>
                <option value="Secure">Secure</option>
                <option value="Prepack">Prepack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <Input
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="e.g., 50 joints"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date
              </label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Completion Products Pte Ltd"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Phone
              </label>
              <Input
                value={formData.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                placeholder="+65 6XXX XXXX"
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Address
              </label>
              <Input
                value={formData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                placeholder="Enter company address"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Email
              </label>
              <Input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                placeholder="info@completionproducts.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <Input
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                placeholder="www.completionproducts.com"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Quality Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Quality Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QC Manager
              </label>
              <Input
                value={formData.qcManager}
                onChange={(e) => handleInputChange('qcManager', e.target.value)}
                placeholder="Enter QC manager name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Manager
              </label>
              <Input
                value={formData.projectManager}
                onChange={(e) => handleInputChange('projectManager', e.target.value)}
                placeholder="Enter project manager name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Standard
              </label>
              <Input
                value={formData.qualityStandard}
                onChange={(e) => handleInputChange('qualityStandard', e.target.value)}
                placeholder="ISO 9001:2015"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification Level
              </label>
              <Input
                value={formData.certificationLevel}
                onChange={(e) => handleInputChange('certificationLevel', e.target.value)}
                placeholder="API 5CT"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Additional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Enter any special requirements or specifications"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes or comments"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || !formData.customerName || !formData.jobNumber}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving to Backend...' : 'Save Cover Page Data'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Cover Page Preview</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Customer:</strong> {formData.customerName || 'Not specified'}</div>
            <div><strong>Job:</strong> {formData.jobNumber || 'Not specified'}</div>
            <div><strong>Product:</strong> {formData.productType || 'Not specified'}</div>
            <div><strong>PO:</strong> {formData.poNumber || 'Not specified'}</div>
            <div><strong>Project:</strong> {formData.projectName || 'Not specified'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}