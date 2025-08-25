const { executeQuery } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('GetJobSteps function executed');

    try {
        const jobId = context.bindingData.jobId;
        
        if (!jobId) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Job ID is required'
                })
            };
            return;
        }

        // Get all steps for the job
        const result = await executeQuery(`
            SELECT 
                id,
                job_id,
                step_number,
                step_name,
                description,
                status,
                data,
                assigned_to,
                completed_by,
                completed_at,
                created_at,
                updated_at
            FROM production_steps 
            WHERE job_id = @param1 
            ORDER BY step_number ASC
        `, [jobId]);

        // Parse JSON data for each step
        const steps = result.rows.map(step => ({
            ...step,
            data: step.data ? (typeof step.data === 'string' ? JSON.parse(step.data) : step.data) : {}
        }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: steps
            })
        };

    } catch (error) {
        context.log.error('Error getting job steps:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve job steps',
                details: error.message
            })
        };
    }
};