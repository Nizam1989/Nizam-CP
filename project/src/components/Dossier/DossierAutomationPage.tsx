import React, { useState } from 'react';
import { DossierControlPanel } from './DossierControlPanel';
import { AutoPDFPreview } from './AutoPDFPreview';
import { FileIntegrationSection } from './FileIntegrationSection';
import { DossierComponentsTable } from './DossierComponentsTable';
import { CoverPageInputForm } from './CoverPageInputForm';
import { generateDossierPDF } from '../../utils/dossierPDFGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../lib/dataService';

const productTypes = [
  {
    name: 'Capture',
    description: 'Sand screen manufacturing dossier',
    color: 'purple',
  },
  {
    name: 'Endure',
    description: 'Durability testing dossier',
    color: 'orange',
  },
  {
    name: 'Assure',
    description: 'Quality assurance dossier',
    color: 'green',
  },
  {
    name: 'Secure',
    description: 'Security validation dossier',
    color: 'red',
  },
];

export function DossierAutomationPage() {
  const { user } = useAuth();
  const [selectedDossierProduct, setSelectedDossierProduct] = useState('');
  const [jobId, setJobId] = useState('');
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [mtrStatus, setMtrStatus] = useState<'idle' | 'fetching' | 'found' | 'not_found'>('idle');
  const [generatedDossierUrl, setGeneratedDossierUrl] = useState<string>();
  const [mtrFileName, setMtrFileName] = useState<string>();
  const [attachedDossierComponents, setAttachedDossierComponents] = useState<Record<string, any>>({});
  const [coverPageData, setCoverPageData] = useState<any>(null);

  // Load saved cover page data on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('dossier_cover_page_data');
    if (savedData) {
      setCoverPageData(JSON.parse(savedData));
    }
  }, []);

  const handleDossierGenerate = async (inputJobId: string) => {
    setJobId(inputJobId);
    setGenerationStatus('pending');
    setMtrStatus('fetching');

    try {
      // Get job details
      const job = dataService.getJobById(inputJobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Simulate MTR fetching
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate MTR result (80% success rate)
      const mtrFound = Math.random() > 0.2;
      if (mtrFound) {
        setMtrStatus('found');
        setMtrFileName(`MTR_${inputJobId}.pdf`);
      } else {
        setMtrStatus('not_found');
      }

      // Simulate dossier generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate comprehensive PDF dossier
      const dossierData = {
        jobId: inputJobId,
        jobNumber: job.job_number,
        productType: selectedDossierProduct,
        attachedComponents: attachedDossierComponents,
        coverPageData: coverPageData,
        generatedBy: user?.full_name || 'System',
        generatedAt: new Date().toISOString()
      };

      const blob = await generateDossierPDF(dossierData);
      const url = URL.createObjectURL(blob);
      setGeneratedDossierUrl(url);
      setGenerationStatus('success');

      // Save PDF report reference
      dataService.createPDFReport({
        job_id: inputJobId,
        file_name: `Quality_Dossier_${job.job_number}.pdf`,
        generated_by: user?.id || '',
        generated_at: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error generating dossier:', error);
      setGenerationStatus('error');
      setMtrStatus('not_found');
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      purple: selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
      orange: selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300',
      green: selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
      red: selected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dossier Automation</h1>
        <p className="text-gray-600 mt-2">
          Automatically generate comprehensive job dossiers with all required documentation
        </p>
      </div>

      {/* Product Type Selection */}
      {!selectedDossierProduct && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Product Type</h2>
            <p className="text-gray-600 mb-6">Choose the product type to generate its quality dossier</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productTypes.map((product) => (
              <div
                key={product.name}
                onClick={() => setSelectedDossierProduct(product.name)}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${getColorClasses(
                  product.color,
                  false
                )} hover:shadow-lg`}
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                </div>
                <p className="text-gray-600 text-sm">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dossier Interface - Only show when product is selected */}
      {selectedDossierProduct && (
        <>
          {/* Selected Product Header */}
          <div className="bg-blue-600 rounded-xl border border-blue-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedDossierProduct} Quality Dossier
                </h2>
                <p className="text-blue-100">
                  {productTypes.find(p => p.name === selectedDossierProduct)?.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDossierProduct('');
                  setJobId('');
                  setGenerationStatus('idle');
                  setMtrStatus('idle');
                  setGeneratedDossierUrl(undefined);
                  setMtrFileName(undefined);
                  setAttachedDossierComponents({});
                }}
                className="px-4 py-2 text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors"
              >
                Change Product
              </button>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <CoverPageInputForm
                onSave={(data) => setCoverPageData(data)}
                initialData={coverPageData}
              />
              
              <DossierControlPanel
                onDossierGenerate={handleDossierGenerate}
                generationStatus={generationStatus}
                generatedDossierUrl={generatedDossierUrl}
              />
              
              <FileIntegrationSection
                jobId={jobId}
                mtrStatus={mtrStatus}
                mtrFileName={mtrFileName}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AutoPDFPreview
                pdfUrl={generatedDossierUrl}
                isLoading={generationStatus === 'pending'}
                jobId={jobId}
              />
            </div>
          </div>
          {/* Full Width Components Table */}
          <div className="mt-8 w-full">
            <DossierComponentsTable
              jobId={jobId}
              generationStatus={generationStatus}
              selectedDossierProduct={selectedDossierProduct}
              attachedComponents={attachedDossierComponents}
              onAttachComponent={(componentId, data) => {
                setAttachedDossierComponents(prev => ({
                  ...prev,
                  [componentId]: data
                }));
              }}
              onFetchComponent={(componentId, data) => {
                setAttachedDossierComponents(prev => ({
                  ...prev,
                  [componentId]: data
                }));
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}