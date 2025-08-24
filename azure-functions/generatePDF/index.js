const { app } = require('@azure/functions');
const PDFDocument = require('pdfmake/build/pdfmake');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const { BlobServiceClient } = require('@azure/storage-blob');

app.http('generatePDF', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const serviceClient = new WebPubSubServiceClient(
            process.env.WebPubSubConnectionString, 
            'manufacturing'
        );
        
        try {
            const body = await request.json();
            const { jobId, formData, templateType } = body;
            
            // Generate PDF content based on template
            const docDefinition = generateManufacturingPDF(jobId, formData, templateType);
            
            const pdfDoc = PDFDocument.createPdf(docDefinition);
            const pdfBuffer = await generatePdfBuffer(pdfDoc);
            
            // Save to blob storage (implement your storage logic)
            const pdfUrl = await savePdfToBlob(pdfBuffer, jobId);
            
            // Notify all users that PDF is ready
            await serviceClient.sendToAll({
                type: 'pdfGenerated',
                data: {
                    jobId: jobId,
                    pdfUrl: pdfUrl,
                    templateType: templateType,
                    generatedAt: new Date().toISOString()
                }
            }, {
                contentType: 'application/json'
            });
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    pdfUrl: pdfUrl 
                })
            };
            
        } catch (error) {
            context.log.error('PDF generation error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'PDF generation failed',
                    message: error.message 
                })
            };
        }
    }
});

function generateManufacturingPDF(jobId, formData, templateType) {
    return {
        content: [
            { text: 'Manufacturing Quality Report', style: 'header' },
            { text: `Job ID: ${jobId}`, style: 'subheader' },
            { text: `Template: ${templateType}`, style: 'subheader' },
            { text: `Generated: ${new Date().toLocaleDateString()}`, style: 'subheader' },
            { text: '\n' },
            
            // Form data table
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*'],
                    body: [
                        ['Field', 'Value'],
                        ...Object.entries(formData).map(([key, value]) => [key, value])
                    ]
                }
            }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
        }
    };
}

async function generatePdfBuffer(pdfDoc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

async function savePdfToBlob(pdfBuffer, jobId) {
    try {
        // Initialize blob service client
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        
        const containerName = 'manufacturing-pdfs';
        const blobName = `${jobId}-${Date.now()}.pdf`;
        
        // Get container client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Create container if it doesn't exist
        await containerClient.createIfNotExists({
            access: 'blob'
        });
        
        // Get block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Upload PDF buffer
        await blockBlobClient.upload(pdfBuffer, pdfBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: 'application/pdf'
            }
        });
        
        // Return public URL
        return `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;
        
    } catch (error) {
        console.error('Error saving PDF to blob:', error);
        throw new Error('Failed to save PDF to storage');
    }
}