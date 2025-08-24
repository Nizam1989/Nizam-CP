import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Download, Save } from 'lucide-react';
import jsPDF from 'jspdf';

export function BasePipeVerificationForm() {
  const [lengthColumns, setLengthColumns] = useState(['D1', 'ME', 'D2', 'ME', 'D3', 'ME', 'D4', 'ME', 'D5', 'ME']);
  const [rows, setRows] = useState(2);
  const [noteBoxes, setNoteBoxes] = useState(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Project Information
    jobNo: '',
    drawingNo: '',
    
    // Measuring Equipment
    equipmentA: '',
    equipmentB: '',
    equipmentC: '',
    equipmentD: '',
    equipmentE: '',
    equipmentF: '',
    equipmentG: '',
    equipmentH: '',
    equipmentJ: '',
    equipmentK: '',
    
    // Notes
    d1Note: '',
    d2Note: '',
    d3Note: '',
    d4Note: '',
    d5Note: '',
    d6Note: ''
  });
  
  // Table data state for Length Verification table
  const [lengthTableData, setLengthTableData] = useState({});
  
  // Table data state for Countersunk Dimension table
  const [countersunkTableData, setCountersunkTableData] = useState({});

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLengthTableDataChange = (rowIndex, columnKey, value) => {
    setLengthTableData(prev => ({
      ...prev,
      [`${rowIndex}-${columnKey}`]: value
    }));
  };

  const handleCountersunkTableDataChange = (rowIndex, columnKey, value) => {
    setCountersunkTableData(prev => ({
      ...prev,
      [`${rowIndex}-${columnKey}`]: value
    }));
  };

  const getLengthTableValue = (rowIndex, columnKey) => {
    return lengthTableData[`${rowIndex}-${columnKey}`] || '';
  };

  const getCountersunkTableValue = (rowIndex, columnKey) => {
    return countersunkTableData[`${rowIndex}-${columnKey}`] || '';
  };

  const addRow = () => {
    setRows(rows + 1);
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(rows - 1);
    }
  };

  const addLengthColumn = () => {
    const nextDNumber = Math.floor(lengthColumns.length / 2) + 1;
    setLengthColumns([...lengthColumns, `D${nextDNumber}`, 'ME']);
  };

  const removeLengthColumn = () => {
    if (lengthColumns.length > 2) {
      setLengthColumns(lengthColumns.slice(0, -2)); // Remove last D and ME pair
    }
  };

  const addNoteBox = () => {
    const nextDNumber = noteBoxes.length + 1;
    setNoteBoxes([...noteBoxes, `D${nextDNumber}`]);
  };

  const removeNoteBox = () => {
    if (noteBoxes.length > 1) {
      setNoteBoxes(noteBoxes.slice(0, -1));
    }
  };

  const generatePDF = () => {
    try {
      // Create PDF in landscape A4
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 10;
      let y = margin;

      // Helper function to wrap text
      const wrapText = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const testWidth = pdf.getTextWidth(testLine);
          
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      // Function to draw page header
      const drawPageHeader = (pageNum, totalPages) => {
        let headerY = margin;
        
        // Header - Form number, title, and date
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Form F6002 Rev:01', margin, headerY);
        pdf.text('7/28/2025', pageWidth - margin - 25, headerY);
        headerY += 8;

        // Title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('BASE PIPE PERFORATION (FIRST PIECE) VERIFICATION FORM', pageWidth / 2, headerY, { align: 'center' });
        headerY += 12;

        // Page number (only show on page 2+)
      
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, headerY, { align: 'center' });
          headerY += 6;
    

        // Horizontal line
        pdf.setLineWidth(0.5);
        pdf.line(margin, headerY, pageWidth - margin, headerY);
        headerY += 8;
        
        return headerY;
      };

      // Draw first page header
      y = drawPageHeader(1, 1);

      // 1. PROJECT INFORMATION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. PROJECT INFORMATION', margin, y);
      y += 10;
      
      // Project info fields - smaller boxes with labels outside
      const boxHeight = 5;
      const fieldWidth = (pageWidth - 2 * margin - 3) / 2;
      
      const projectFields = [
        { label: 'Job No:', value: formData.jobNo },
        { label: 'Drawing No:', value: formData.drawingNo }
      ];

      // Draw labels above boxes
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      projectFields.forEach((field, index) => {
        const x = margin + (index * (fieldWidth + 3));
        pdf.text(field.label, x, y - 1);
      });
      y += 2;

      projectFields.forEach((field, index) => {
        const x = margin + (index * (fieldWidth + 3));
        
        // Draw grey border with rounded corners
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(128, 128, 128); // Grey color
        pdf.roundedRect(x, y, fieldWidth, boxHeight, 1.5, 1.5, 'S');
        
        // Value
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(field.value || '', x + 2, y + 5);
      });
      
      y += boxHeight + 8;

      // 2. MEASURING EQUIPMENT (ME)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. MEASURING EQUIPMENT (ME)', margin, y);
      y += 2;

      // ME fields with labels outside - first row
      const meFieldWidth = (pageWidth - 2 * margin - 12) / 5;
      const meFields1 = [
        { label: 'A):', value: formData.equipmentA },
        { label: 'B):', value: formData.equipmentB },
        { label: 'C):', value: formData.equipmentC },
        { label: 'D):', value: formData.equipmentD },
        { label: 'E):', value: formData.equipmentE }
      ];

      // Draw labels above boxes - first row
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      meFields1.forEach((field, index) => {
        const x = margin + (index * (meFieldWidth + 3));
        pdf.text(field.label, x, y - 1);
      });
      y += 2;

      meFields1.forEach((field, index) => {
        const x = margin + (index * (meFieldWidth + 3));
        
        // Draw grey border with rounded corners
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(128, 128, 128); // Grey color
        pdf.roundedRect(x, y, meFieldWidth, boxHeight, 1.5, 1.5, 'S');
        
        // Value
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(field.value || '', x + 1, y + 5);
      });
      
      y += boxHeight + 3;

      // ME fields - second row
      const meFields2 = [
        { label: 'F):', value: formData.equipmentF },
        { label: 'G):', value: formData.equipmentG },
        { label: 'H):', value: formData.equipmentH },
        { label: 'J):', value: formData.equipmentJ },
        { label: 'K):', value: formData.equipmentK }
      ];

      // Draw labels above boxes - second row
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      meFields2.forEach((field, index) => {
        const x = margin + (index * (meFieldWidth + 3));
        pdf.text(field.label, x, y - 1);
      });
      y += 2;

      meFields2.forEach((field, index) => {
        const x = margin + (index * (meFieldWidth + 3));
        
        // Draw grey border with rounded corners
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(128, 128, 128); // Grey color
        pdf.roundedRect(x, y, meFieldWidth, boxHeight, 1.5, 1.5, 'S');
        
        // Value
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(field.value || '', x + 1, y + 5);
      });
      
      y += boxHeight + 6;

      // 3. LENGTH VERIFICATION
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. LENGTH VERIFICATION', margin, y);
      y += 4;

      // Length Verification Table
      const drawLengthVerificationTable = (startY) => {
        const tableWidth = pageWidth - 2 * margin;
        const rowHeight = 8;
        const headerHeight = 16;
        
        // Calculate column widths dynamically
        const fixedCols = {
          perfMachine: 25,
          jointNo: 18,
          drillBit: 20,
          holes: 20,
          visual: 30,
          inspected: 30
        };
        
        const fixedWidth = Object.values(fixedCols).reduce((sum, width) => sum + width, 0);
        const remainingWidth = tableWidth - fixedWidth;
        const dynamicColWidth = remainingWidth / lengthColumns.length;

        // Draw table border
        pdf.setLineWidth(0.5);
        pdf.rect(margin, startY, tableWidth, headerHeight + (rows * rowHeight));

        // Draw header background
        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, startY, tableWidth, headerHeight, 'F');

        // Draw header text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);

        let currentX = margin;
        
        // Draw headers
        const headers = [
          { text: 'Perforation Machine', width: fixedCols.perfMachine },
          { text: 'Joint No.', width: fixedCols.jointNo }
        ];
        
        // Add dynamic length columns
        lengthColumns.forEach(col => {
          headers.push({ text: col, width: dynamicColWidth });
        });
        
        // Add remaining fixed columns
        headers.push(
          { text: 'Drill Bit Size', width: fixedCols.drillBit },
          { text: 'No. of Holes/ring', width: fixedCols.holes },
          { text: 'Visual Inspection Pattern', width: fixedCols.visual },
          { text: 'Inspected By', width: fixedCols.inspected }
        );

        currentX = margin;
        headers.forEach((header, index) => {
          // Draw vertical line
          pdf.line(currentX, startY, currentX, startY + headerHeight);
          
          // Wrap and center text
          const lines = wrapText(header.text, header.width);
          const startTextY = startY + (headerHeight - (lines.length * 4)) / 2 + 3;
          
          lines.forEach((line, lineIndex) => {
            const textWidth = pdf.getTextWidth(line);
            const textX = currentX + (header.width - textWidth) / 2;
            pdf.text(line, textX, startTextY + (lineIndex * 4));
          });
          
          currentX += header.width;
        });
        
        // Final vertical line
        pdf.line(currentX, startY, currentX, startY + headerHeight);

        // Draw data rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          const rowY = startY + headerHeight + (rowIndex * rowHeight);
          
          // Alternating row colors
          if (rowIndex % 2 === 1) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, rowY, tableWidth, rowHeight, 'F');
          }
          
          // Draw horizontal line
          pdf.line(margin, rowY, margin + tableWidth, rowY);
          
          currentX = margin;
          const dataColumns = ['perfMachine', 'jointNo', ...lengthColumns.map(col => col.toLowerCase()), 'drillBit', 'holes', 'visual', 'inspected'];
          
          dataColumns.forEach((col, colIndex) => {
            let width;
            if (colIndex === 0) width = fixedCols.perfMachine;
            else if (colIndex === 1) width = fixedCols.jointNo;
            else if (colIndex < 2 + lengthColumns.length) width = dynamicColWidth;
            else if (colIndex === 2 + lengthColumns.length) width = fixedCols.drillBit;
            else if (colIndex === 3 + lengthColumns.length) width = fixedCols.holes;
            else if (colIndex === 4 + lengthColumns.length) width = fixedCols.visual;
            else width = fixedCols.inspected;
            
            // Draw vertical line
            pdf.line(currentX, rowY, currentX, rowY + rowHeight);
            
            // Get and draw cell value
            const cellValue = getLengthTableValue(rowIndex, col);
            if (cellValue) {
              const text = cellValue.toString();
              const maxTextWidth = width - 4;
              const truncatedText = pdf.getTextWidth(text) > maxTextWidth ? 
                text.substring(0, Math.floor(text.length * maxTextWidth / pdf.getTextWidth(text))) + '...' : text;
              pdf.text(truncatedText, currentX + 2, rowY + 5);
            }
            
            currentX += width;
          });
          
          // Final vertical line
          pdf.line(currentX, rowY, currentX, rowY + rowHeight);
        }
        
        // Bottom border
        pdf.line(margin, startY + headerHeight + (rows * rowHeight), margin + tableWidth, startY + headerHeight + (rows * rowHeight));
        
        return startY + headerHeight + (rows * rowHeight) + 10;
      };

      y = drawLengthVerificationTable(y);

      // Countersunk Dimension Table
      const drawCountersunkTable = (startY) => {
        const tableWidth = pageWidth - 2 * margin;
        const rowHeight = 12;
        const headerHeight = 24;
        
        // Column widths for countersunk table
        const colWidths = {
          perfMachine: 20,
          jointNo: 15,
          orientation: 20, meOrientation: 10,
          countersunk: 20, meCountersunk: 10,
          plugGauge: 20, mePlugGauge: 10,
          surface: 20, meSurface: 10,
          angle: 15, meAngle: 10,
          diameter: 15, meDiameter: 10,
          inspected: 25
        };

        // Check if we need a new page
        if (startY + headerHeight + (rows * rowHeight) > pageHeight - 30) {
          pdf.addPage();
          startY = margin + 20; // Simple margin without duplicate header
        }

        // Draw table border
        pdf.setLineWidth(0.5);
        pdf.rect(margin, startY, tableWidth, headerHeight + (rows * rowHeight));

        // Draw header background
        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, startY, tableWidth, headerHeight, 'F');

        // Draw header text
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);

        let currentX = margin;
        
        // Simplified headers to prevent overlapping
        pdf.text('Perf Machine', currentX + 2, startY + 6);
        pdf.line(currentX + colWidths.perfMachine, startY, currentX + colWidths.perfMachine, startY + headerHeight);
        currentX += colWidths.perfMachine;

        pdf.text('Joint No.', currentX + 2, startY + 6);
        pdf.line(currentX + colWidths.jointNo, startY, currentX + colWidths.jointNo, startY + headerHeight);
        currentX += colWidths.jointNo;

        // Orientation
        pdf.text('Orientation', currentX + 2, startY + 4);
        pdf.text('(Pass/Fail)', currentX + 2, startY + 10);
        pdf.line(currentX + colWidths.orientation, startY, currentX + colWidths.orientation, startY + headerHeight);
        currentX += colWidths.orientation;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.meOrientation, startY, currentX + colWidths.meOrientation, startY + headerHeight);
        currentX += colWidths.meOrientation;
        
        // Countersunk
        pdf.text('Countersunk', currentX + 2, startY + 4);
        pdf.text('(Pass/Fail)', currentX + 2, startY + 10);
        pdf.line(currentX + colWidths.countersunk, startY, currentX + colWidths.countersunk, startY + headerHeight);
        currentX += colWidths.countersunk;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.meCountersunk, startY, currentX + colWidths.meCountersunk, startY + headerHeight);
        currentX += colWidths.meCountersunk;
        
        // 2M Plug Gauge (highlighted)
        pdf.setFillColor(255, 255, 0);
        pdf.rect(currentX, startY, colWidths.plugGauge + colWidths.mePlugGauge, headerHeight, 'F');
        pdf.text('2M Plug Gauge', currentX + 2, startY + 4);
        pdf.text('(Pass/Fail)', currentX + 2, startY + 10);
        pdf.line(currentX + colWidths.plugGauge, startY, currentX + colWidths.plugGauge, startY + headerHeight);
        currentX += colWidths.plugGauge;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.mePlugGauge, startY, currentX + colWidths.mePlugGauge, startY + headerHeight);
        currentX += colWidths.mePlugGauge;
        
        // Surface Finish
        pdf.setFillColor(200, 200, 200); // Reset background
        pdf.text('Surface Finish', currentX + 2, startY + 4);
        pdf.text('(Pass/Fail)', currentX + 2, startY + 10);
        pdf.line(currentX + colWidths.surface, startY, currentX + colWidths.surface, startY + headerHeight);
        currentX += colWidths.surface;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.meSurface, startY, currentX + colWidths.meSurface, startY + headerHeight);
        currentX += colWidths.meSurface;
        
        // Angle
        pdf.text('Angle', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.angle, startY, currentX + colWidths.angle, startY + headerHeight);
        currentX += colWidths.angle;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.meAngle, startY, currentX + colWidths.meAngle, startY + headerHeight);
        currentX += colWidths.meAngle;
        
        // Diameter
        pdf.text('Diameter', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.diameter, startY, currentX + colWidths.diameter, startY + headerHeight);
        currentX += colWidths.diameter;
        
        pdf.text('ME', currentX + 2, startY + 8);
        pdf.line(currentX + colWidths.meDiameter, startY, currentX + colWidths.meDiameter, startY + headerHeight);
        currentX += colWidths.meDiameter;

        pdf.text('Inspected By', currentX + 2, startY + 6);
        pdf.text('(Sign/date)', currentX + 2, startY + 12);

        // Draw data rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          const rowY = startY + headerHeight + (rowIndex * rowHeight);
          
          // Alternating row colors
          if (rowIndex % 2 === 1) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, rowY, tableWidth, rowHeight, 'F');
          }
          
          // Highlight 2M Plug Gauge column in data rows
          const plugGaugeX = margin + colWidths.perfMachine + colWidths.jointNo + colWidths.orientation + colWidths.meOrientation + colWidths.countersunk + colWidths.meCountersunk;
          pdf.setFillColor(255, 255, 0);
          pdf.rect(plugGaugeX, rowY, colWidths.plugGauge + colWidths.mePlugGauge, rowHeight, 'F');
          
          // Draw horizontal line
          pdf.line(margin, rowY, margin + tableWidth, rowY);
          
          currentX = margin;
          const columns = ['perfMachine', 'jointNo', 'orientation', 'meOrientation', 'countersunk', 'meCountersunk', 'plugGauge', 'mePlugGauge', 'surface', 'meSurface', 'angle', 'meAngle', 'diameter', 'meDiameter', 'inspected'];
          
          columns.forEach((col, colIndex) => {
            const width = colWidths[col] || 15;
            
            // Draw vertical line
            pdf.line(currentX, rowY, currentX, rowY + rowHeight);
            
            // Get and draw cell value
            const cellValue = getCountersunkTableValue(rowIndex, col);
            if (cellValue) {
              pdf.text(cellValue.toString(), currentX + 2, rowY + 7);
            }
            
            currentX += width;
          });
          
          // Final vertical line
          pdf.line(currentX, rowY, currentX, rowY + rowHeight);
        }
        
        // Bottom border
        pdf.line(margin, startY + headerHeight + (rows * rowHeight), margin + tableWidth, startY + headerHeight + (rows * rowHeight));
        
        return startY + headerHeight + (rows * rowHeight) + 10;
      };

      y = drawCountersunkTable(y);

      // 4. NOTES
      // Notes Section
      if (y > pageHeight - 50) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. NOTES', margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('D: Dimension', margin + 15, y);
      y += 10;

      // Note fields
      const noteFields = noteBoxes.map(box => ({
        label: `${box}:`,
        value: formData[`${box.toLowerCase()}Note`] || ''
      }));

      // Draw note fields in boxes
      const boxWidth = 80;
      const noteBoxHeight = 8;
      const boxSpacing = 10;
      
      noteFields.forEach((field, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = margin + (col * (boxWidth + boxSpacing));
        const currentY = y + (row * (noteBoxHeight + 8));
        
        // Draw box
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(128, 128, 128);
        pdf.roundedRect(x, currentY, boxWidth, noteBoxHeight, 1.5, 1.5, 'S');
        
        // Label
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(field.label, x + 2, currentY + 4);
        
        // Value
        pdf.setFont('helvetica', 'normal');
        if (field.value) {
          pdf.text(field.value, x + 12, currentY + 8);
        }
      });

      // Footer
      const finalTotalPages = pdf.getNumberOfPages();
      
      // Update page headers with correct total page count
      for (let i = 1; i <= finalTotalPages; i++) {
        pdf.setPage(i);
        
        // Only add page number once per page
        if (i > 1) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Page ${i} of ${finalTotalPages}`, pageWidth / 2, margin + 8, { align: 'center' });
        }
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Completion Products Pte Ltd', margin, pageHeight - 8);
        if (i === 1) {
          pdf.text('7/28/2025', pageWidth - margin - 25, pageHeight - 8);
        }
      }

      pdf.save(`BasePipe_Verification_Form_${formData.jobNo || 'Draft'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 bg-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="text-sm text-gray-600">Form F6002 Rev:01</div>
        <h1 className="text-2xl font-bold text-center">BASE PIPE PERFORATION (FIRST PIECE) VERIFICATION FORM</h1>
        <div className="text-sm text-gray-600">7/28/2025</div>
      </div>

      {/* 1. PROJECT INFORMATION */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">1. PROJECT INFORMATION</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Job No:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg" 
              value={formData.jobNo}
              onChange={(e) => handleFormDataChange('jobNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drawing No.:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg" 
              value={formData.drawingNo}
              onChange={(e) => handleFormDataChange('drawingNo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. MEASURING EQUIPMENT (ME) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">2. MEASURING EQUIPMENT (ME)</h2>
        <div className="grid grid-cols-5 gap-4">
          {['A', 'B', 'C', 'D', 'E'].map((letter) => (
            <div key={letter} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{letter}):</label>
              <Input 
                className="h-10 border border-gray-400 rounded-lg" 
                value={formData[`equipment${letter}`]}
                onChange={(e) => handleFormDataChange(`equipment${letter}`, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          {['F', 'G', 'H', 'J', 'K'].map((letter) => (
            <div key={letter} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{letter}):</label>
              <Input 
                className="h-10 border border-gray-400 rounded-lg" 
                value={formData[`equipment${letter}`]}
                onChange={(e) => handleFormDataChange(`equipment${letter}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rows:</span>
              <button
                onClick={removeRow}
                disabled={rows <= 1}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
              >
                Remove
              </button>
              <button
                onClick={addRow}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Add
              </button>
              <span className="text-sm text-gray-600">Total: {rows}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Length Columns:</span>
              <button
                onClick={removeLengthColumn}
                disabled={lengthColumns.length <= 2}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
              >
                Remove
              </button>
              <button
                onClick={addLengthColumn}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Add
              </button>
              <span className="text-sm text-gray-600">Total: {lengthColumns.length / 2}</span>
            </div>
          </div>
          
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Save className="w-4 h-4" />
            Save & Download PDF
          </button>
        </div>
      </div>

      {/* Length Verification Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">3. LENGTH VERIFICATION</h2>
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <Table className="text-base">
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Perforation Machine</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Joint No.</TableHead>
                {lengthColumns.map((col, index) => (
                  <TableHead key={index} className="border border-gray-300 text-center text-white font-normal text-xs">{col}</TableHead>
                ))}
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Drill Bit Size</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">No. of Holes/ring</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Visual Inspection Perforation Pattern (Pass/Fail)</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Inspected By (Sign/date)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className={rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                  <TableCell className="border border-gray-300 h-10 p-1">
                    <Input className="w-full h-8 border-0 text-xs text-center p-1 font-normal" value={getLengthTableValue(rowIndex, 'perfMachine')} onChange={(e) => handleLengthTableDataChange(rowIndex, 'perfMachine', e.target.value)} />
                  </TableCell>
                  <TableCell className="border border-gray-300 h-10 p-1">
                    <Input className="w-full h-8 border-0 text-xs text-center p-1 font-normal" value={getLengthTableValue(rowIndex, 'jointNo')} onChange={(e) => handleLengthTableDataChange(rowIndex, 'jointNo', e.target.value)} />
                  </TableCell>
                  {lengthColumns.map((col, colIndex) => (
                    <TableCell key={colIndex} className="border border-gray-300 h-10 p-1">
                      <Input 
                        className="w-full h-8 border-0 text-xs text-center p-1 font-normal"
                        value={getLengthTableValue(rowIndex, col.toLowerCase().replace('me', 'me'))}
                        onChange={(e) => handleLengthTableDataChange(rowIndex, col.toLowerCase().replace('me', 'me'), e.target.value)}
                      />
                    </TableCell>
                  ))}
                  {['drillBit', 'holes', 'visual', 'inspected'].map((col) => (
                    <TableCell key={col} className="border border-gray-300 h-10 p-1">
                      <Input 
                        className="w-full h-8 border-0 text-xs text-center p-1 font-normal"
                        value={getLengthTableValue(rowIndex, col)}
                        onChange={(e) => handleLengthTableDataChange(rowIndex, col, e.target.value)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Countersunk Dimension Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">4. COUNTERSUNK DIMENSION & OTHER CHECKS</h2>
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <Table className="text-base">
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Perforation Machine</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Joint No.</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Orientation of Perforated Holes</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Countersunk & Thread Verification</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs bg-yellow-300 text-black">2M Plug Gauge Fit Test</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs bg-yellow-300 text-black">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Surface Finish (If applicable)</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Angle</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Diameter</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">ME</TableHead>
                <TableHead className="border border-gray-300 text-center text-white font-normal text-xs">Inspected By (Sign/date)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className={rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                  {['perfMachine', 'jointNo', 'orientation', 'meOrientation', 'countersunk', 'meCountersunk', 'plugGauge', 'mePlugGauge', 'surface', 'meSurface', 'angle', 'meAngle', 'diameter', 'meDiameter', 'inspected'].map((col, colIndex) => {
                    const isPassFailColumn = ['orientation', 'countersunk', 'plugGauge', 'surface'].includes(col);
                    
                    return (
                    <TableCell key={col} className={`border border-gray-300 h-10 p-1 ${colIndex === 6 || colIndex === 7 ? 'bg-yellow-100' : ''}`}>
                      {isPassFailColumn ? (
                        <select
                          className="w-full h-8 border-0 text-xs text-center p-1 font-normal bg-transparent"
                          value={getCountersunkTableValue(rowIndex, col)}
                          onChange={(e) => handleCountersunkTableDataChange(rowIndex, col, e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      ) : (
                        <Input 
                          className="w-full h-8 border-0 text-xs text-center p-1 font-normal"
                          value={getCountersunkTableValue(rowIndex, col)}
                          onChange={(e) => handleCountersunkTableDataChange(rowIndex, col, e.target.value)}
                        />
                      )}
                    </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">5. NOTES</h2>
        <div>
          <span className="text-sm font-bold">Note:</span>
          <span className="text-sm ml-2">D: Dimension</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {noteBoxes.map((box, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{box}:</label>
              <Input 
                className="h-8 border border-gray-400 rounded" 
                value={formData[`${box.toLowerCase()}Note`] || ''}
                onChange={(e) => handleFormDataChange(`${box.toLowerCase()}Note`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t text-sm text-gray-600">
        <div>Completion Products Pte Ltd</div>
        <div>7/28/2025</div>
      </div>
    </div>
  );
}