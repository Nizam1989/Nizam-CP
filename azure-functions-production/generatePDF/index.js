const { executeQuery, logSystemUpdate, uuidv4 } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('GeneratePDF function executed');

    try {
        const { jobId, templateType, formData } = req.body;
        
        // Mock PDF generation (in production, would generate actual PDF)
        const fileName = `${jobId}-${templateType}-${Date.now()}.pdf`;
        const reportId = uuidv4();
        
        // Insert PDF report record
        await executeQuery(`
            INSERT INTO pdf_reports (id, job_id, file_name, generated_by)
            VALUES (@param1, @param2, @param3, @param4)
        `, [reportId, jobId, fileName, formData.inspector || 'system']);

        // Log system update
        await logSystemUpdate('created', 'pdf', jobId, {
            fileName,
            templateType,
            reportId,
            generatedAt: new Date().toISOString()
        }, formData.inspector || 'system');

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    reportId,
                    fileName,
                    templateType,
                    pdfUrl: `https://nizamcpstorage44793.blob.core.windows.net/manufacturing-pdfs/${fileName}`,
                    generatedAt: new Date().toISOString()
                }
            })
        };

    } catch (error) {
        context.log.error('Error generating PDF:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to generate PDF',
                details: error.message
            })
        };
    }
};