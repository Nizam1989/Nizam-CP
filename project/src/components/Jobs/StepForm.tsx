import React, { useState } from 'react';
import { ArrowLeft, Save, CheckCircle, Clock, Download, SkipForward } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import BasePipePerforationForm from '../Forms/BasePipePerforationForm';
import { BasePipeVerificationForm } from '../Forms/BasePipeVerificationForm';

interface StepFormProps {
  step: any;
  job: any;
  onBack: () => void;
  onUpdate: (updatedStep: any) => void;
}

const StepForm: React.FC<StepFormProps> = ({ step, job, onBack, onUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(step.data || {});
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveStep = async (markComplete: boolean = false) => {
    setSaving(true);
    try {
      // Auto-save current form data first
      const updatedStep = {
        ...step,
        data: formData,
        ...(markComplete && {
          completed_by: user?.id,
          completed_at: new Date().toISOString()
        })
      };

      // Update step in database
      const result = await dataService.updateJobStep(step.job_id, step.step_number, updatedStep);
      if (!result) throw new Error('Failed to update step');

      console.log('✅ Step data saved to backend:', {
        jobId: step.job_id,
        stepNumber: step.step_number,
        completed: markComplete,
        dataSize: Object.keys(formData).length
      });

      // Check if all steps are completed after this update
      if (markComplete) {
        const allSteps = await dataService.getJobSteps(step.job_id);
        const completedSteps = allSteps.filter(s => 
          s.completed_at || s.skipped_at || (s.id === step.id)
        );
        
        // If all steps are completed/skipped, mark job as completed
        if (completedSteps.length === allSteps.length) {
          await completeJob();
        }
      }

      onUpdate(updatedStep);

      if (markComplete) {
        onBack();
      } else {
        // Show success message for save progress
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Error saving step data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completeJob = async () => {
    try {
      // Mark job as completed
      const updatedJob = await dataService.updateJob(step.job_id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        current_stage: 'Completed'
      });
      
      if (!updatedJob) throw new Error('Failed to complete job');

      // Generate PDF report
      await generatePDFReport();
      
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const generatePDFReport = async () => {
    try {
      // This would generate the job completion report
      console.log('Generating completion report for job:', step.job_id);
      
      // Save report reference
      await dataService.createPDFReport({
        job_id: step.job_id,
        file_name: `${job.job_number}_completion_report.pdf`,
        generated_by: user?.id || '',
        generated_at: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const skipStep = async () => {
    if (window.confirm(`Are you sure you want to skip "${step.step_name}"? This step will be marked as skipped and you can continue to the next step.`)) {
      setSaving(true);
      try {
        const updatedStep = {
          ...step,
          data: formData,
          skipped_by: user?.id,
          skipped_at: new Date().toISOString()
        };

        await dataService.updateJobStep(step.job_id, step.step_number, updatedStep);
        onUpdate(updatedStep);
        onBack();
      } catch (error) {
        console.error('Error skipping step:', error);
      } finally {
        setSaving(false);
      }
    }
  };
  const downloadPDF = async () => {
    setDownloading(true);
    try {
      // Create PDF in landscape orientation
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BASE PIPE PERFORATION FORM', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Job Information
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Job No: ${job.job_number}`, margin, y);
      pdf.text(`Date: ${formData.date || new Date().toLocaleDateString()}`, margin + 60, y);
      y += 10;

      // Machine Setup Section
      pdf.setFont('helvetica', 'bold');
      pdf.text('MACHINE SETUP & PERFORATION PATTERN CHECK', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Perforation Machine: ${formData.perforation_machine || ''}`, margin, y);
      pdf.text(`Hole Diameter (Drawing ref): ${formData.hole_diameter_ref || ''}`, margin + 80, y);
      y += 6;
      pdf.text(`Air & coolant check: ${formData.air_coolant_check || ''}`, margin, y);
      pdf.text(`Set-up Operator: ${formData.setup_operator || ''}`, margin + 80, y);
      y += 6;
      pdf.text(`Verification Operator: ${formData.verification_operator || ''}`, margin, y);
      y += 10;

      // QC Section
      pdf.setFont('helvetica', 'bold');
      pdf.text('QC FIRST PIECE INSPECTION', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Machine No: ${formData.machine_no || ''}`, margin, y);
      pdf.text(`Joint No: ${formData.joint_no || ''}`, margin + 60, y);
      y += 6;
      pdf.text(`Inspected By: ${formData.inspected_by || ''}`, margin, y);
      y += 10;

      // Measuring Equipment
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEASURING EQUIPMENT (ME)', margin, y);
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`A) ${formData.me_a || ''}`, margin, y);
      pdf.text(`B) ${formData.me_b || ''}`, margin + 40, y);
      pdf.text(`C) ${formData.me_c || ''}`, margin + 80, y);
      pdf.text(`D) ${formData.me_d || ''}`, margin + 120, y);
      y += 10;

      // Additional Information
      pdf.text(`Total Quantity: ${formData.total_quantity || ''}`, margin, y);
      pdf.text(`Drawing No: ${formData.drawing_no || ''}`, margin + 80, y);
      y += 6;
      pdf.text(`Distance from Coupling: ${formData.distance_coupling || ''}`, margin, y);
      y += 15;

      // Measurement Table
      if (formData.measurement_rows && formData.measurement_rows.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('MEASUREMENT DATA', margin, y);
        y += 8;

        // Table headers
        const headers = ['Joint No', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'ME', 'Operator', 'Remarks'];
        const colWidth = (pageWidth - 2 * margin) / headers.length;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        headers.forEach((header, index) => {
          pdf.text(header, margin + (index * colWidth) + 2, y);
        });
        y += 6;

        // Table data
        pdf.setFont('helvetica', 'normal');
        formData.measurement_rows.forEach((row, rowIndex) => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
          }
          
          const rowData = [
            row.joint_no || '',
            row.l1 || '', row.l2 || '', row.l3 || '', row.l4 || '', row.l5 || '',
            row.l6 || '', row.l7 || '', row.l8 || '', row.l9 || '', row.l10 || '',
            row.me || '',
            row.operator_sign || '',
            row.remarks || ''
          ];
          
          rowData.forEach((data, index) => {
            const text = data.length > 8 ? data.substring(0, 8) + '...' : data;
            pdf.text(text, margin + (index * colWidth) + 2, y);
          });
          y += 5;
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} by ${user?.full_name || 'System'}`, margin, pageHeight - 10);
      pdf.text(`Page 1 of 1`, pageWidth - margin - 20, pageHeight - 10);

      // Download the PDF
      const fileName = `${job.job_number}_basepipe_perforation.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const renderFormFields = () => {
    switch (step.step_name) {
      case 'Basepipe perforation':
        return (
          <BasePipePerforationForm />
        );
      
      case 'Base pipe perforation verification':
        return (
          <BasePipeVerificationForm />
        );
      
      default:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{step.step_name}</h3>
              <p className="text-gray-600 mb-4">
                Complete the required tasks for this manufacturing step.
              </p>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add notes or observations..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{step.step_name}</h1>
          <p className="text-gray-600">Step {step.step_number} of {job.total_stages}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Job: {job.job_number}</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Successfully saved!</span>
            <span className="text-sm">Step data has been saved to the backend.</span>
          </div>
        )}
        
        {renderFormFields()}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-3 mt-3 border-t border-gray-200">
        <div></div>
        
        <div className="flex gap-3">
          <button
            onClick={() => saveStep(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          {!step.completed_at && !step.skipped_at && (
            <button
              onClick={skipStep}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip Step
            </button>
          )}
          {!step.completed_at && (
            <button
              onClick={() => saveStep(true)}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Completing...' : 'Complete Step'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { StepForm };
export default StepForm;