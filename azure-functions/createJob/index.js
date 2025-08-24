const { app } = require('@azure/functions');
const { db, dbUtils } = require('../shared/database');
const { v4: uuidv4 } = require('uuid');

app.http('createJob', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Create job request received');

        try {
            const body = await request.json();
            const {
                jobNumber,
                title,
                productType = 'Custom',
                createdBy,
                assignedTo,
                totalStages = 5
            } = body;

            // Validate required fields
            if (!jobNumber || !title || !createdBy) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Missing required fields: jobNumber, title, createdBy'
                    })
                };
            }

            const jobId = uuidv4();
            const now = new Date().toISOString();

            // Insert the job
            const insertQuery = `
                INSERT INTO manufacturing_jobs 
                (id, job_number, title, product_type, status, current_stage, total_stages, created_by, assigned_to, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                jobId,
                jobNumber,
                title,
                productType,
                'draft',
                'Planning',
                totalStages,
                createdBy,
                assignedTo,
                now,
                now
            ];

            const result = await db.query(insertQuery, values);
            const newJob = result.rows[0];

            // Create default production steps
            const defaultSteps = [
                'Material Preparation',
                'Production Setup',
                'Manufacturing Process',
                'Quality Control',
                'Final Inspection'
            ];

            for (let i = 0; i < Math.min(totalStages, defaultSteps.length); i++) {
                await db.query(`
                    INSERT INTO production_steps 
                    (job_id, step_number, step_name, description, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    jobId,
                    i + 1,
                    defaultSteps[i] || `Step ${i + 1}`,
                    `Complete ${defaultSteps[i] || `Step ${i + 1}`}`,
                    'pending',
                    now,
                    now
                ]);
            }

            // Transform job data for response
            const jobData = {
                id: newJob.id,
                jobNumber: newJob.job_number,
                title: newJob.title,
                productType: newJob.product_type,
                status: newJob.status,
                currentStage: newJob.current_stage,
                totalStages: newJob.total_stages,
                createdBy: newJob.created_by,
                assignedTo: newJob.assigned_to,
                createdAt: newJob.created_at,
                updatedAt: newJob.updated_at
            };

            // Log system update for real-time polling
            await dbUtils.logSystemUpdate('created', 'job', jobId, jobData, createdBy);

            context.log(`Job created successfully: ${jobNumber}`);

            return {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: JSON.stringify({
                    success: true,
                    data: jobData,
                    message: 'Job created successfully'
                })
            };

        } catch (error) {
            context.log.error('Error creating job:', error);
            
            // Handle duplicate job number
            if (error.code === '23505' && error.constraint === 'manufacturing_jobs_job_number_key') {
                return {
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Job number already exists',
                        message: 'A job with this number already exists'
                    })
                };
            }

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to create job',
                    message: error.message
                })
            };
        }
    }
});