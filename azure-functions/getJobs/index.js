const { app } = require('@azure/functions');
const { db } = require('../shared/database');

app.http('getJobs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Get jobs request received');

        try {
            const url = new URL(request.url);
            const status = url.searchParams.get('status');
            const limit = parseInt(url.searchParams.get('limit')) || 50;
            const offset = parseInt(url.searchParams.get('offset')) || 0;

            let query = `
                SELECT 
                    j.*,
                    COALESCE(step_stats.completed_steps, 0) as completed_steps,
                    COALESCE(step_stats.total_steps, 0) as total_steps,
                    COALESCE(notification_stats.open_notifications, 0) as open_notifications
                FROM manufacturing_jobs j
                LEFT JOIN (
                    SELECT 
                        job_id,
                        COUNT(*) as total_steps,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_steps
                    FROM production_steps 
                    GROUP BY job_id
                ) step_stats ON j.id = step_stats.job_id
                LEFT JOIN (
                    SELECT 
                        job_id,
                        COUNT(*) as open_notifications
                    FROM quality_notifications 
                    WHERE status = 'open'
                    GROUP BY job_id
                ) notification_stats ON j.id = notification_stats.job_id
            `;

            const queryParams = [];
            let paramCount = 0;

            if (status) {
                query += ` WHERE j.status = $${++paramCount}`;
                queryParams.push(status);
            }

            query += ` ORDER BY j.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
            queryParams.push(limit, offset);

            const result = await db.query(query, queryParams);
            
            // Transform the data for frontend consumption
            const jobs = result.rows.map(job => ({
                id: job.id,
                jobNumber: job.job_number,
                title: job.title,
                productType: job.product_type,
                status: job.status,
                currentStage: job.current_stage,
                totalStages: job.total_stages,
                createdBy: job.created_by,
                assignedTo: job.assigned_to,
                startedAt: job.started_at,
                completedAt: job.completed_at,
                holdReason: job.hold_reason,
                createdAt: job.created_at,
                updatedAt: job.updated_at,
                progress: {
                    completed: parseInt(job.completed_steps) || 0,
                    total: parseInt(job.total_steps) || 0
                },
                openNotifications: parseInt(job.open_notifications) || 0
            }));

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: JSON.stringify({
                    success: true,
                    data: jobs,
                    meta: {
                        count: jobs.length,
                        offset: offset,
                        limit: limit
                    }
                })
            };

        } catch (error) {
            context.log.error('Error getting jobs:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to get jobs',
                    message: error.message
                })
            };
        }
    }
});