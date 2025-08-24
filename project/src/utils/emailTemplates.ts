// Email templates for Quality Notifications

export interface QNEmailData {
  qnNumber: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  jobNumber?: string;
  raisedBy: string;
  raisedByRole: string;
  assignedTo: string;
  createdAt: string;
  attachedImages?: any[];
  serialNumber?: string;
  batchNumber?: string;
  partNumber?: string;
  customerPO?: string;
  workOrder?: string;
  machineId?: string;
  operatorId?: string;
  shift?: string;
  productionLine?: string;
  materialLot?: string;
  inspectionStage?: string;
  defectLocation?: string;
  quantityAffected?: string;
  rootCauseCategory?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export const generateQNEmailHTML = (data: QNEmailData): string => {
  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B', 
    high: '#EF4444',
    critical: '#DC2626'
  };

  const priorityColor = priorityColors[data.priority];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Notification - ${data.qnNumber}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .qn-details {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 120px;
        }
        .detail-value {
            color: #1e293b;
            flex: 1;
            text-align: right;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: white;
            background-color: ${priorityColor};
        }
        .description-section {
            margin: 25px 0;
        }
        .description-section h3 {
            color: #1e293b;
            margin-bottom: 12px;
            font-size: 18px;
        }
        .description-content {
            background-color: #f1f5f9;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.6;
        }
        .images-section {
            margin: 25px 0;
        }
        .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-top: 12px;
        }
        .image-item {
            text-align: center;
            background-color: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .action-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            text-align: center;
            margin-top: 30px;
            border-radius: 8px;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 0 8px;
            transition: transform 0.2s;
        }
        .action-button:hover {
            transform: translateY(-1px);
        }
        .footer {
            background-color: #1e293b;
            color: #94a3b8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        .footer a {
            color: #60a5fa;
            text-decoration: none;
        }
        .urgent-banner {
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .detail-value {
                text-align: left;
                margin-top: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${data.priority === 'critical' ? '<div class="urgent-banner">🚨 CRITICAL QUALITY ISSUE - IMMEDIATE ATTENTION REQUIRED</div>' : ''}
        
        <div class="header">
            <h1>Quality Notification</h1>
            <p>${data.qnNumber}</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">${data.title}</h2>
            
            <div class="qn-details">
                <div class="detail-row">
                    <span class="detail-label">QN Number:</span>
                    <span class="detail-value"><strong>${data.qnNumber}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Priority:</span>
                    <span class="detail-value"><span class="priority-badge">${data.priority}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${data.category.charAt(0).toUpperCase() + data.category.slice(1)}</span>
                </div>
                ${data.jobNumber ? `
                <div class="detail-row">
                    <span class="detail-label">Related Job:</span>
                    <span class="detail-value"><strong>${data.jobNumber}</strong></span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Raised By:</span>
                    <span class="detail-value">${data.raisedBy} (${data.raisedByRole})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Assigned To:</span>
                    <span class="detail-value"><strong>${data.assignedTo}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${new Date(data.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
            </div>
            
            ${data.serialNumber || data.batchNumber || data.partNumber ? `
            <div class="qn-details">
                <h3 style="color: #1e293b; margin-bottom: 12px; font-size: 16px;">Manufacturing Information</h3>
                ${data.serialNumber ? `
                <div class="detail-row">
                    <span class="detail-label">Serial Number:</span>
                    <span class="detail-value"><code>${data.serialNumber}</code></span>
                </div>
                ` : ''}
                ${data.batchNumber ? `
                <div class="detail-row">
                    <span class="detail-label">Batch/Lot:</span>
                    <span class="detail-value"><code>${data.batchNumber}</code></span>
                </div>
                ` : ''}
                ${data.partNumber ? `
                <div class="detail-row">
                    <span class="detail-label">Part Number:</span>
                    <span class="detail-value"><code>${data.partNumber}</code></span>
                </div>
                ` : ''}
                ${data.customerPO ? `
                <div class="detail-row">
                    <span class="detail-label">Customer PO:</span>
                    <span class="detail-value"><code>${data.customerPO}</code></span>
                </div>
                ` : ''}
                ${data.workOrder ? `
                <div class="detail-row">
                    <span class="detail-label">Work Order:</span>
                    <span class="detail-value"><code>${data.workOrder}</code></span>
                </div>
                ` : ''}
                ${data.machineId ? `
                <div class="detail-row">
                    <span class="detail-label">Machine ID:</span>
                    <span class="detail-value"><code>${data.machineId}</code></span>
                </div>
                ` : ''}
                ${data.operatorId ? `
                <div class="detail-row">
                    <span class="detail-label">Operator ID:</span>
                    <span class="detail-value"><code>${data.operatorId}</code></span>
                </div>
                ` : ''}
                ${data.shift ? `
                <div class="detail-row">
                    <span class="detail-label">Shift:</span>
                    <span class="detail-value">${data.shift.charAt(0).toUpperCase() + data.shift.slice(1).replace('_', ' ')}</span>
                </div>
                ` : ''}
                ${data.productionLine ? `
                <div class="detail-row">
                    <span class="detail-label">Production Line:</span>
                    <span class="detail-value">${data.productionLine.replace('_', ' ').toUpperCase()}</span>
                </div>
                ` : ''}
                ${data.materialLot ? `
                <div class="detail-row">
                    <span class="detail-label">Material Lot:</span>
                    <span class="detail-value"><code>${data.materialLot}</code></span>
                </div>
                ` : ''}
                ${data.inspectionStage ? `
                <div class="detail-row">
                    <span class="detail-label">Inspection Stage:</span>
                    <span class="detail-value">${data.inspectionStage.charAt(0).toUpperCase() + data.inspectionStage.slice(1).replace('_', ' ')}</span>
                </div>
                ` : ''}
                ${data.defectLocation ? `
                <div class="detail-row">
                    <span class="detail-label">Defect Location:</span>
                    <span class="detail-value">${data.defectLocation}</span>
                </div>
                ` : ''}
                ${data.quantityAffected ? `
                <div class="detail-row">
                    <span class="detail-label">Quantity Affected:</span>
                    <span class="detail-value">${data.quantityAffected} units</span>
                </div>
                ` : ''}
                ${data.rootCauseCategory ? `
                <div class="detail-row">
                    <span class="detail-label">Root Cause Category:</span>
                    <span class="detail-value">${data.rootCauseCategory.charAt(0).toUpperCase() + data.rootCauseCategory.slice(1).replace('_', ' ')}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="description-section">
                <h3>Issue Description</h3>
                <div class="description-content">${data.description}</div>
            </div>
            
            ${data.attachedImages && data.attachedImages.length > 0 ? `
            <div class="images-section">
                <h3>Attached Images (${data.attachedImages.length})</h3>
                <div class="images-grid">
                    ${data.attachedImages.map(img => `
                        <div class="image-item">
                            <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                            <div style="font-size: 12px; color: #64748b;">${img.name}</div>
                        </div>
                    `).join('')}
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
                    * Images are attached to this email or can be viewed in the system
                </p>
            </div>
            ` : ''}
            
            ${data.resolutionNotes ? `
            <div class="description-section">
                <h3>Resolution Notes</h3>
                <div class="description-content" style="background-color: #f0fdf4; border-left: 4px solid #22c55e;">
                    ${data.resolutionNotes}
                </div>
                ${data.resolvedBy ? `
                <p style="font-size: 12px; color: #16a34a; margin-top: 8px;">
                    <strong>Resolved by:</strong> ${data.resolvedBy} on ${data.resolvedAt ? new Date(data.resolvedAt).toLocaleDateString() : 'Unknown date'}
                </p>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="action-section">
                <h3 style="margin-top: 0; color: #1e293b;">Next Steps</h3>
                <p style="margin-bottom: 20px; color: #475569;">
                    ${data.resolutionNotes ? 'This quality notification has been resolved. Please review the resolution notes above.' : 'Please review this quality notification and take appropriate action.'}
                </p>
                <a href="#" class="action-button">View in System</a>
                ${!data.resolutionNotes ? '<a href="#" class="action-button" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">Mark as Reviewed</a>' : ''}
            </div>
        </div>
        
        <div class="footer">
            <p>
                This email was sent by the Completion Products Quality Management System.<br>
                <a href="#">Unsubscribe</a> | <a href="#">Contact Support</a>
            </p>
            <p style="margin-top: 12px; font-size: 11px;">
                © ${new Date().getFullYear()} Completion Products Pte Ltd. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

export const generateQNEmailText = (data: QNEmailData): string => {
  return `
QUALITY NOTIFICATION - ${data.qnNumber}
${data.priority === 'critical' ? '🚨 CRITICAL QUALITY ISSUE - IMMEDIATE ATTENTION REQUIRED' : ''}

Title: ${data.title}

QN Details:
- QN Number: ${data.qnNumber}
- Priority: ${data.priority.toUpperCase()}
- Category: ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}
${data.jobNumber ? `- Related Job: ${data.jobNumber}` : ''}
- Raised By: ${data.raisedBy} (${data.raisedByRole})
- Assigned To: ${data.assignedTo}
- Created: ${new Date(data.createdAt).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}

${data.serialNumber || data.batchNumber || data.partNumber ? `
Manufacturing Information:
${data.serialNumber ? `- Serial Number: ${data.serialNumber}` : ''}
${data.batchNumber ? `- Batch/Lot: ${data.batchNumber}` : ''}
${data.partNumber ? `- Part Number: ${data.partNumber}` : ''}
${data.customerPO ? `- Customer PO: ${data.customerPO}` : ''}
${data.workOrder ? `- Work Order: ${data.workOrder}` : ''}
${data.machineId ? `- Machine ID: ${data.machineId}` : ''}
${data.operatorId ? `- Operator ID: ${data.operatorId}` : ''}
${data.shift ? `- Shift: ${data.shift.charAt(0).toUpperCase() + data.shift.slice(1).replace('_', ' ')}` : ''}
${data.productionLine ? `- Production Line: ${data.productionLine.replace('_', ' ').toUpperCase()}` : ''}
${data.materialLot ? `- Material Lot: ${data.materialLot}` : ''}
${data.inspectionStage ? `- Inspection Stage: ${data.inspectionStage.charAt(0).toUpperCase() + data.inspectionStage.slice(1).replace('_', ' ')}` : ''}
${data.defectLocation ? `- Defect Location: ${data.defectLocation}` : ''}
${data.quantityAffected ? `- Quantity Affected: ${data.quantityAffected} units` : ''}
${data.rootCauseCategory ? `- Root Cause Category: ${data.rootCauseCategory.charAt(0).toUpperCase() + data.rootCauseCategory.slice(1).replace('_', ' ')}` : ''}
` : ''}

Issue Description:
${data.description}

${data.attachedImages && data.attachedImages.length > 0 ? `
Attached Images: ${data.attachedImages.length} file(s)
${data.attachedImages.map(img => `- ${img.name}`).join('\n')}
` : ''}

${data.resolutionNotes ? `
Resolution Notes:
${data.resolutionNotes}

Resolved by: ${data.resolvedBy || 'Unknown'} on ${data.resolvedAt ? new Date(data.resolvedAt).toLocaleDateString() : 'Unknown date'}
` : ''}

Next Steps:
${data.resolutionNotes ? 'This quality notification has been resolved. Please review the resolution notes above.' : 'Please review this quality notification and take appropriate action through the Quality Management System.'}

---
This email was sent by the Completion Products Quality Management System.
© ${new Date().getFullYear()} Completion Products Pte Ltd. All rights reserved.
  `.trim();
};