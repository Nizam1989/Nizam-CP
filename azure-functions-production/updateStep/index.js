const { executeQuery, logSystemUpdate, uuidv4 } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('UpdateStep function executed');

    try {
        const { jobId, stepNumber, status, completedBy } = req.body;

        // Check if step exists
        let stepResult = await executeQuery(`
            SELECT id FROM production_steps 
            WHERE job_id = @param1 AND step_number = @param2
        `, [jobId, stepNumber]);

        let stepId;
        if (stepResult.rows.length === 0) {
            // Create the step
            stepId = uuidv4();
            await executeQuery(`
                INSERT INTO production_steps (id, job_id, step_number, step_name, description, status, completed_by, completed_at)
                VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
                stepId, 
                jobId, 
                stepNumber, 
                `Step ${stepNumber}`,
                `Production step ${stepNumber}`,
                status,
                status === 'completed' ? completedBy : null,
                status === 'completed' ? new Date() : null
            ]);
        } else {
            // Update existing step
            stepId = stepResult.rows[0].id;
            await executeQuery(`
                UPDATE production_steps 
                SET status = @param1, completed_by = @param2, completed_at = @param3
                WHERE id = @param4
            `, [
                status, 
                status === 'completed' ? completedBy : null, 
                status === 'completed' ? new Date() : null, 
                stepId
            ]);
        }

        // Update job current stage if step completed
        if (status === 'completed') {
            await executeQuery(`
                UPDATE manufacturing_jobs 
                SET current_stage = @param1, updated_at = @param2
                WHERE id = @param3 AND current_stage < @param1
            `, [stepNumber + 1, new Date(), jobId]);
        }

        // Log system update
        await logSystemUpdate('updated', 'step', jobId, {
            stepNumber,
            stepName: `Step ${stepNumber}`,
            status,
            jobId,
            completedBy,
            completedAt: status === 'completed' ? new Date().toISOString() : null
        }, completedBy);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    stepId,
                    jobId,
                    stepNumber,
                    status,
                    completedBy,
                    completedAt: status === 'completed' ? new Date().toISOString() : null
                }
            })
        };

    } catch (error) {
        context.log.error('Error updating step:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to update production step',
                details: error.message
            })
        };
    }
};