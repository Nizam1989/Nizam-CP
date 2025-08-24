import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { FormAttachmentModal } from './FormAttachmentModal';
import { useState, useEffect } from 'react';

interface DossierComponent {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'ready' | 'error' | 'included' | 'attached';
  source: string;
  type: 'auto-generated' | 'attachment' | 'external-api';
  sequence: number;
}

interface DossierComponentsTableProps {
  jobId?: string;
  generationStatus: 'idle' | 'pending' | 'success' | 'error';
  selectedDossierProduct?: string;
  attachedComponents?: Record<string, any>;
  onAttachComponent?: (componentId: string, data: any) => void;
  onFetchComponent?: (componentId: string, data: any) => void;
}

export function DossierComponentsTable({ 
  jobId, 
  generationStatus, 
  selectedDossierProduct,
  attachedComponents = {},
  onAttachComponent,
  onFetchComponent
}: DossierComponentsTableProps) {
  const [attachmentModal, setAttachmentModal] = useState<{
    isOpen: boolean;
    componentId: string;
    componentName: string;
  }>({
    isOpen: false,
    componentId: '',
    componentName: ''
  });
  
  const [sharePointConfig, setSharePointConfig] = useState<any>(null);
  const [fetchingComponents, setFetchingComponents] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load SharePoint config on component mount
    const savedConfig = localStorage.getItem('sharepoint_config');
    if (savedConfig) {
      setSharePointConfig(JSON.parse(savedConfig));
    }
  }, []);
  
  // Define Capture product dossier components in exact sequence
  const captureDossierComponents: DossierComponent[] = [
    {
      id: 'product-cover',
      name: 'Product Cover Page',
      description: 'Auto-generated cover page with job details and company information',
      status: 'ready',
      source: 'Auto-generated',
      type: 'auto-generated',
      sequence: 1
    },
    {
      id: 'table-contents',
      name: 'Table of Contents',
      description: 'Auto-generated table of contents based on attached documents',
      status: 'ready',
      source: 'Auto-generated',
      type: 'auto-generated',
      sequence: 2
    },
    {
      id: 'purchase-order',
      name: 'Purchase Order',
      description: 'Customer purchase order document',
      status: 'pending',
      source: 'Manual Upload',
      type: 'attachment',
      sequence: 3
    },
    {
      id: 'certificate-conformance',
      name: 'Certificate of Conformance',
      description: 'Quality conformance certificate',
      status: 'pending',
      source: 'Manual Upload',
      type: 'attachment',
      sequence: 4
    },
    {
      id: 'assembly-drawings',
      name: 'Final Assembly Drawings',
      description: 'Technical drawings for final assembly',
      status: 'pending',
      source: 'Manual Upload',
      type: 'attachment',
      sequence: 5
    },
    {
      id: 'component-list',
      name: 'Component List',
      description: 'List of all components used in manufacturing',
      status: 'ready',
      source: 'Internal Database',
      type: 'auto-generated',
      sequence: 6
    },
    {
      id: 'mill-certificate',
      name: 'Mill Certificate',
      description: 'Material Test Report (MTR) from supplier',
      status: 'pending',
      source: 'SharePoint API',
      type: 'external-api',
      sequence: 7
    },
    {
      id: 'torque-chart',
      name: 'Torque Chart (if applicable)',
      description: 'Torque specifications and measurements',
      status: 'pending',
      source: 'Manual Upload',
      type: 'attachment',
      sequence: 8
    },
    {
      id: 'slot-summary',
      name: 'Slot Summary Measurement',
      description: 'Summary of slot measurements from manufacturing steps',
      status: 'ready',
      source: 'Internal Database',
      type: 'auto-generated',
      sequence: 9
    },
    {
      id: 'liquid-dye',
      name: 'Liquid Dye Penetrant',
      description: 'Liquid dye penetrant inspection results',
      status: 'pending',
      source: 'Manufacturing Forms',
      type: 'attachment',
      sequence: 10
    },
    {
      id: 'final-inspection',
      name: 'Final Inspection',
      description: 'Final quality inspection report',
      status: 'pending',
      source: 'Manufacturing Forms',
      type: 'attachment',
      sequence: 11
    },
    {
      id: 'assembly-traceability',
      name: 'Assembly Traceability',
      description: 'Complete traceability of assembly process including Base Pipe Perforation, Base Pipe Verification, etc.',
      status: 'pending',
      source: 'Manufacturing Forms',
      type: 'attachment',
      sequence: 12
    }
  ];

  const getComponentStatus = (componentId: string, component: DossierComponent): 'pending' | 'ready' | 'error' | 'included' | 'attached' => {
    if (generationStatus === 'success') return 'included';
    if (generationStatus === 'pending') return 'pending';
    if (generationStatus === 'error') return 'error';
    
    // Check if component is attached
    if (attachedComponents[componentId]) {
      return 'attached';
    }
    
    // Return the component's default status
    return component.status;
  };

  // Get components based on selected product type
  const getComponents = (): DossierComponent[] => {
    if (selectedDossierProduct === 'Capture') {
      return captureDossierComponents.map(component => ({
        ...component,
        status: getComponentStatus(component.id, component)
      }));
    }
    
    // Default fallback for other product types
    return [];
  };

  const components = getComponents();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'included':
        return <div className="w-4 h-4 bg-green-600 rounded-full"></div>;
      case 'attached':
        return <div className="w-4 h-4 bg-blue-600 rounded-full"></div>;
      case 'ready':
        return <div className="w-4 h-4 bg-green-600 rounded-full"></div>;
      case 'pending':
        return <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>;
      case 'error':
        return <div className="w-4 h-4 bg-red-600 rounded-full"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'included':
        return 'Included';
      case 'attached':
        return 'Attached';
      case 'ready':
        return 'Ready';
      case 'pending':
        return 'Pending';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'included':
        return 'text-green-600 bg-green-50';
      case 'attached':
        return 'text-blue-600 bg-blue-50';
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleAttachComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      setAttachmentModal({
        isOpen: true,
        componentId,
        componentName: component.name
      });
    }
  };

  const handleAttachmentModalClose = () => {
    setAttachmentModal({
      isOpen: false,
      componentId: '',
      componentName: ''
    });
  };

  const handleAttachmentComplete = (componentId: string, data: any) => {
    if (onAttachComponent) {
      onAttachComponent(componentId, data);
    }
  };

  const handleFetchComponent = async (componentId: string) => {
    if (!sharePointConfig?.isConfigured) {
      // Redirect to settings page for SharePoint configuration
      alert('Please configure SharePoint API in Settings first. Only administrators can access this feature.');
      return;
    }

    setFetchingComponents(prev => new Set([...prev, componentId]));

    try {
      // Simulate SharePoint API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate finding MTR file (80% success rate)
      const found = Math.random() > 0.2;
      
      if (found) {
        const fetchedData = {
          type: 'external_fetch',
          source: 'SharePoint',
          fileName: `MTR_${jobId || 'Unknown'}.pdf`,
          fetchedAt: new Date().toISOString(),
          status: 'success'
        };
        
        if (onFetchComponent) {
          onFetchComponent(componentId, fetchedData);
        }
      } else {
        throw new Error('MTR file not found in SharePoint');
      }
    } catch (error) {
      console.error('Error fetching component:', error);
      // Handle error - could show toast notification
    } finally {
      setFetchingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentId);
        return newSet;
      });
    }
  };


  if (!selectedDossierProduct) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          Dossier Components Overview
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a product type to view dossier components</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {selectedDossierProduct} Dossier Components Overview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[200px]">Component</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Source</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium text-gray-500">
                    {component.sequence}
                  </TableCell>
                  <TableCell className="font-medium">
                    {component.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {component.description}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {component.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(component.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                        {getStatusText(component.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {component.type === 'attachment' && component.status === 'pending' && (
                      <button
                        onClick={() => handleAttachComponent(component.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Attach
                      </button>
                    )}
                    {component.type === 'external-api' && component.status === 'pending' && (
                      <button
                        onClick={() => handleFetchComponent(component.id)}
                        disabled={fetchingComponents.has(component.id)}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                      >
                        {fetchingComponents.has(component.id) ? (
                          'Fetching...'
                        ) : (
                          'Fetch'
                        )}
                      </button>
                    )}
                    {(component.status === 'attached' || component.status === 'ready') && (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Components Ready: {components.filter(c => c.status === 'ready' || c.status === 'included' || c.status === 'attached').length} / {components.length}
            </span>
            {generationStatus === 'success' && (
              <span className="text-green-600 font-medium">
                ✅ All components included in dossier
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Form Attachment Modal */}
    <FormAttachmentModal
      isOpen={attachmentModal.isOpen}
      onClose={handleAttachmentModalClose}
      componentId={attachmentModal.componentId}
      componentName={attachmentModal.componentName}
      onAttach={handleAttachmentComplete}
    />
    </>
  );
}