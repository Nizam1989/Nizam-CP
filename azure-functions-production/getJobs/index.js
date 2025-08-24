const { executeQuery } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('GetJobs function executed');

    try {
        const result = await executeQuery(`
            SELECT 
                id, 
                job_number as jobNumber, 
                title, 
                status, 
                product_type as productType,
                current_stage as currentStage,
                total_stages as totalStages,
                created_by as createdBy, 
                assigned_to as assignedTo,
                started_at as startedAt,
                completed_at as completedAt,
                hold_reason as holdReason,
                created_at as createdAt, 
                updated_at as updatedAt
            FROM manufacturing_jobs 
            ORDER BY created_at DESC
        `);

        // Add progress calculation
        const jobs = result.rows.map(job => ({
            ...job,
            progress: {
                completed: Math.max(0, job.currentStage - 1),
                total: job.totalStages
            }
        }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: jobs
            })
        };

    } catch (error) {
        context.log.error('Error getting jobs:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve jobs',
                details: error.message
            })
        };
    }
};