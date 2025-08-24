import jsPDF from 'jspdf';

export const generateJobPDF = async (job: any, steps: any[]): Promise<Blob> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Manufacturing Job Report', margin, y);
  y += 15;

  // Job Header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Job Number: ${job.job_number}`, margin, y);
  y += 8;
  pdf.text(`Product Type: ${job.product_type}`, margin, y);
  y += 8;
  pdf.text(`Status: ${job.status}`, margin, y);
  y += 8;
  pdf.text(`Started: ${new Date(job.started_at).toLocaleDateString()}`, margin, y);
  y += 8;
  if (job.completed_at) {
    pdf.text(`Completed: ${new Date(job.completed_at).toLocaleDateString()}`, margin, y);
    y += 8;
  }
  y += 10;

  // Steps
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Process Steps', margin, y);
  y += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  steps.forEach((step, index) => {
    // Check if we need a new page
    if (y > 250) {
      pdf.addPage();
      y = margin;
    }

    // Step header
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${step.step_number}. ${step.step_name}`, margin, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    if (step.completed_at) {
      pdf.text(`Completed: ${new Date(step.completed_at).toLocaleDateString()}`, margin + 10, y);
      y += 6;
    }

    // Step data
    if (step.data && Object.keys(step.data).length > 0) {
      Object.entries(step.data).forEach(([key, value]) => {
        if (value) {
          const text = `${key.replace(/_/g, ' ')}: ${value}`;
          const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin - 10);
          pdf.text(lines, margin + 10, y);
          y += lines.length * 6;
        }
      });
    }
    y += 10;
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`,
      margin,
      pdf.internal.pageSize.getHeight() - 10
    );
  }

  return pdf.output('blob');
};