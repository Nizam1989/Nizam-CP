const { app } = require('@azure/functions');
const { db, dbUtils } = require('../shared/database');

app.http('updateStep', {
    methods: ['PUT', 'PATCH'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Update production step request received');

        try {
            const body = await request.json();
            const { stepId, jobId, stepNumber, status, completedBy, data } = body;

            // Validate required fields
            if (!stepId && (!jobId || !stepNumber)) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Either stepId or (jobId + stepNumber) is required'
                    })
                };
            }

            if (!status || !completedBy) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Missing required fields: status, completedBy'
                    })
                };
            }

            let updateQuery;
            let queryParams;
            let whereClause;

            if (stepId) {
                whereClause = 'id = $5';
                queryParams = [status, completedBy, new Date().toISOString(), new Date().toISOString(), stepId];
            } else {
                whereClause = 'job_id = $5 AND step_number = $6';
                queryParams = [status, completedBy, new Date().toISOString(), new Date().toISOString(), jobId, stepNumber];
            }

            if (data) {
                updateQuery = `
                    UPDATE production_steps 
                    SET status = $1, completed_by = $2, completed_at = $3, updated_at = $4, data = $${queryParams.length + 1}
                    WHERE ${whereClause}
                    RETURNING *
                `;
                queryParams.push(JSON.stringify(data));
            } else {
                updateQuery = `
                    UPDATE production_steps 
                    SET status = $1, completed_by = $2, completed_at = $3, updated_at = $4
                    WHERE ${whereClause}
                    RETURNING *
                `;
            }

            const result = await db.query(updateQuery, queryParams);

            if (result.rowCount === 0) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Production step not found'
                    })
                };
            }

            const updatedStep = result.rows[0];

            // Get job information for the update
            const jobQuery = await db.query(
                'SELECT job_number, title, status FROM manufacturing_jobs WHERE id = $1',
                [updatedStep.job_id]
            );
            const jobInfo = jobQuery.rows[0];

            // Check if we should update job status based on step completion
            if (status === 'completed') {
                const stepsQuery = await db.query(`
                    SELECT 
                        COUNT(*) as total_steps,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_steps
                    FROM production_steps 
                    WHERE job_id = $1
                `, [updatedStep.job_id]);

                const stepStats = stepsQuery.rows[0];
                
                // If all steps are completed, mark job as completed
                if (parseInt(stepStats.completed_steps) === parseInt(stepStats.total_steps)) {
                    await db.query(`
                        UPDATE manufacturing_jobs 
                        SET status = 'completed', completed_at = $1, current_stage = 'Completed', updated_at = $1
                        WHERE id = $2
                    `, [new Date().toISOString(), updatedStep.job_id]);
                } else if (jobInfo.status === 'draft') {
                    // If first step is being worked on, change job to in_progress
                    await db.query(`
                        UPDATE manufacturing_jobs 
                        SET status = 'in_progress', started_at = $1, current_stage = $2, updated_at = $1
                        WHERE id = $3
                    `, [new Date().toISOString(), updatedStep.step_name, updatedStep.job_id]);
                }
            }

            // Transform step data for response
            const stepData = {
                id: updatedStep.id,
                jobId: updatedStep.job_id,
                stepNumber: updatedStep.step_number,
                stepName: updatedStep.step_name,
                description: updatedStep.description,
                status: updatedStep.status,
                assignedTo: updatedStep.assigned_to,
                completedBy: updatedStep.completed_by,
                completedAt: updatedStep.completed_at,
                data: updatedStep.data,
                createdAt: updatedStep.created_at,
                updatedAt: updatedStep.updated_at,
                job: {
                    jobNumber: jobInfo?.job_number,
                    title: jobInfo?.title
                }
            };

            // Log system update for real-time polling
            await dbUtils.logSystemUpdate('updated', 'step', updatedStep.id, stepData, completedBy);

            context.log(`Step updated successfully: ${updatedStep.step_name} for job ${jobInfo?.job_number}`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: JSON.stringify({
                    success: true,
                    data: stepData,
                    message: 'Production step updated successfully'
                })
            };

        } catch (error) {
            context.log.error('Error updating production step:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to update production step',
                    message: error.message
                })
            };
        }
    }
});