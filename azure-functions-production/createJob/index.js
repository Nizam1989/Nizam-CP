const { executeQuery, logSystemUpdate, uuidv4 } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('CreateJob function executed');

    try {
        const { jobNumber, title, productType, createdBy, totalStages = 5 } = req.body;
        const jobId = uuidv4();

        // Insert job into database
        await executeQuery(`
            INSERT INTO manufacturing_jobs (id, job_number, title, product_type, total_stages, created_by)
            VALUES (@param1, @param2, @param3, @param4, @param5, @param6)
        `, [jobId, jobNumber, title, productType, totalStages, createdBy]);

        // Log system update for real-time polling
        await logSystemUpdate('created', 'job', jobId, {
            jobNumber,
            title,
            status: 'draft',
            productType
        }, createdBy);

        const jobData = {
            id: jobId,
            jobNumber,
            title,
            status: 'draft',
            productType,
            currentStage: 1,
            totalStages,
            createdBy,
            createdAt: new Date().toISOString()
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: jobData
            })
        };

    } catch (error) {
        context.log.error('Error creating job:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to create job',
                details: error.message
            })
        };
    }
};