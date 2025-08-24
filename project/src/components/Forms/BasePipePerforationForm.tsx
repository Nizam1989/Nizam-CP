import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Download, Save, Menu } from 'lucide-react';

export default function BasePipePerforationForm() {
  const [columns, setColumns] = useState(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']);
  const [rows, setRows] = useState(8);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Project Information
    jobNo: '',
    totalQuantity: '',
    drawingNo: '',
    distanceFromCoupling: '',
    
    // Measuring Equipment
    equipmentA: '',
    equipmentB: '',
    equipmentC: '',
    equipmentD: '',
    
    // Process Control & QC Inspection
    holeDiameter: '',
    airCoolant: '',
    machineNo: '',
    jointNo: '',
    setupOperator: '',
    qcInspector: ''
  });
  
  // Table data state
  const [tableData, setTableData] = useState({});

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTableDataChange = (rowIndex, columnKey, value) => {
    setTableData(prev => ({
      ...prev,
      [`${rowIndex}-${columnKey}`]: value
    }));
  };

  const getTableValue = (rowIndex, columnKey) => {
    return tableData[`${rowIndex}-${columnKey}`] || '';
  };

  const addColumn = () => {
    const newColumnNumber = columns.length + 1;
    setColumns([...columns, `L${newColumnNumber}`]);
  };

  const removeColumn = () => {
    if (columns.length > 1) {
      setColumns(columns.slice(0, -1));
    }
  };

  const addRow = () => {
    setRows(rows + 1);
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(rows - 1);
    }
  };

  const generatePDF = () => {
    alert('PDF generation feature would be implemented here');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 bg-white space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-4 space-y-2 sm:space-y-0">
        <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">Form F6001 Rev:05</div>
        <h1 className="text-lg sm:text-2xl font-bold text-center order-1 sm:order-2">BASE PIPE PERFORATION FORM</h1>
        <div className="text-xs sm:text-sm text-gray-600 order-3">7/28/2025</div>
      </div>

      {/* 1. PROJECT INFORMATION */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">1. PROJECT INFORMATION</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Job No:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.jobNo}
              onChange={(e) => handleFormDataChange('jobNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Total Quantity:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.totalQuantity}
              onChange={(e) => handleFormDataChange('totalQuantity', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drawing No:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.drawingNo}
              onChange={(e) => handleFormDataChange('drawingNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Distance from Coupling:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.distanceFromCoupling}
              onChange={(e) => handleFormDataChange('distanceFromCoupling', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. MEASURING EQUIPMENT (ME) */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">2. MEASURING EQUIPMENT (ME)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Equipment A:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.equipmentA}
              onChange={(e) => handleFormDataChange('equipmentA', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Equipment B:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.equipmentB}
              onChange={(e) => handleFormDataChange('equipmentB', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Equipment C:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.equipmentC}
              onChange={(e) => handleFormDataChange('equipmentC', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Equipment D:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.equipmentD}
              onChange={(e) => handleFormDataChange('equipmentD', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. PROCESS CONTROL & QC INSPECTION */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">3. PROCESS CONTROL & QC INSPECTION</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hole Diameter:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.holeDiameter}
              onChange={(e) => handleFormDataChange('holeDiameter', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Air & Coolant:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.airCoolant}
              onChange={(e) => handleFormDataChange('airCoolant', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Machine No:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.machineNo}
              onChange={(e) => handleFormDataChange('machineNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Joint No:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.jointNo}
              onChange={(e) => handleFormDataChange('jointNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Setup Operator:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.setupOperator}
              onChange={(e) => handleFormDataChange('setupOperator', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">QC Inspector:</label>
            <Input 
              className="h-10 border border-gray-400 rounded-lg text-sm" 
              value={formData.qcInspector}
              onChange={(e) => handleFormDataChange('qcInspector', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg space-y-4">
        {/* Mobile: Stack controls vertically */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Columns:</span>
              <button
                onClick={removeColumn}
                disabled={columns.length <= 1}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-500 text-white text-xs sm:text-sm rounded hover:bg-red-600 disabled:opacity-50"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Remove</span>
                <span className="sm:hidden">-</span>
              </button>
              <button
                onClick={addColumn}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-500 text-white text-xs sm:text-sm rounded hover:bg-green-600"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
                <span className="sm:hidden">+</span>
              </button>
              <span className="text-xs sm:text-sm text-gray-600">Total: {columns.length}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Rows:</span>
              <button
                onClick={removeRow}
                disabled={rows <= 1}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-500 text-white text-xs sm:text-sm rounded hover:bg-red-600 disabled:opacity-50"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Remove</span>
                <span className="sm:hidden">-</span>
              </button>
              <button
                onClick={addRow}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-500 text-white text-xs sm:text-sm rounded hover:bg-green-600"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
                <span className="sm:hidden">+</span>
              </button>
              <span className="text-xs sm:text-sm text-gray-600">Total: {rows}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => {
                console.log('Form data saved');
                alert('Form data saved successfully!');
              }}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Form Data</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. DIMENSIONAL MEASUREMENT DATA */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">4. DIMENSIONAL MEASUREMENT DATA</h2>
        
        {/* Mobile: Card-based layout */}
        <div className="block sm:hidden space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <Card key={rowIndex} className="border border-gray-300">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 text-center bg-gray-800 text-white py-2 -mx-4 -mt-4 mb-4">
                  Joint No: {rowIndex + 1}
                </h3>
                
                <div className="space-y-3">
                  {/* Measurement columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {columns.map((col, colIndex) => (
                      <div key={colIndex} className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">{col}:</label>
                        <Input 
                          className="h-8 border border-gray-300 text-sm"
                          value={getTableValue(rowIndex, col)}
                          onChange={(e) => handleTableDataChange(rowIndex, col, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional fields */}
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">ME:</label>
                      <Input 
                        className="h-8 border border-gray-300 text-sm"
                        value={getTableValue(rowIndex, 'ME')}
                        onChange={(e) => handleTableDataChange(rowIndex, 'ME', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">Operator:</label>
                      <Input 
                        className="h-8 border border-gray-300 text-sm"
                        value={getTableValue(rowIndex, 'operator')}
                        onChange={(e) => handleTableDataChange(rowIndex, 'operator', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">Remarks:</label>
                      <Input 
                        className="h-8 border border-gray-300 text-sm"
                        value={getTableValue(rowIndex, 'remarks')}
                        onChange={(e) => handleTableDataChange(rowIndex, 'remarks', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full text-sm min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-300 text-center text-white font-bold min-w-[80px] p-2">Joint No</th>
                {columns.map((col, index) => (
                  <th key={index} className="border border-gray-300 text-center text-white font-bold min-w-[80px] p-2">{col}</th>
                ))}
                <th className="border border-gray-300 text-center text-white font-bold min-w-[60px] p-2">ME</th>
                <th className="border border-gray-300 text-center text-white font-bold min-w-[100px] p-2">Operator</th>
                <th className="border border-gray-300 text-center text-white font-bold min-w-[120px] p-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 h-10 p-2 text-center font-medium">{rowIndex + 1}</td>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 h-10 p-1">
                      <Input 
                        className="w-full h-8 border-0 text-sm text-center p-1"
                        value={getTableValue(rowIndex, col)}
                        onChange={(e) => handleTableDataChange(rowIndex, col, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 h-10 p-1">
                    <Input 
                      className="w-full h-8 border-0 text-sm text-center p-1"
                      value={getTableValue(rowIndex, 'ME')}
                      onChange={(e) => handleTableDataChange(rowIndex, 'ME', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 h-10 p-1">
                    <Input 
                      className="w-full h-8 border-0 text-sm text-center p-1"
                      value={getTableValue(rowIndex, 'operator')}
                      onChange={(e) => handleTableDataChange(rowIndex, 'operator', e.target.value)}
                    />
                  </td>
                  <td className="border border-gray-300 h-10 p-1">
                    <Input 
                      className="w-full h-8 border-0 text-sm text-center p-1"
                      value={getTableValue(rowIndex, 'remarks')}
                      onChange={(e) => handleTableDataChange(rowIndex, 'remarks', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0">
        <div>Completion Products Pte Ltd</div>
        <div>Form F6001 Rev:05</div>
      </div>
    </div>
  );
}