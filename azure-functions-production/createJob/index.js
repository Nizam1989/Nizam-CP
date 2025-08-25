const { executeQuery, logSystemUpdate, uuidv4 } = require('../shared/database');

// Product type to manufacturing stages mapping
const productStages = {
    'Capture': [
        'Incoming Inspection',
        'Basepipe perforation',
        'Base pipe perforation verification', 
        'Base pipe deburring',
        'Base pipe deburring and drifting inspection',
        'Manufacturing wire wrap screen',
        'Screen camera inspection',
        'Welding process',
        'Heat treatment process (if any)',
        'Liquid dye penetrant',
        'Final inspection',
        'Cleaning and packing'
    ],
    'Endure': [
        'Preparation',
        'Initial Testing',
        'Stress Testing',
        'Analysis',
        'Final Report'
    ],
    'Assure': [
        'Planning',
        'Inspection',
        'Testing',
        'Review',
        'Certification'
    ],
    'Secure': [
        'Assessment',
        'Testing',
        'Vulnerability Analysis',
        'Remediation',
        'Verification'
    ],
    'Prepack': [
        'Material Prep',
        'Packaging Setup',
        'Quality Check',
        'Labeling',
        'Final Inspection'
    ],
    'Custom Job': [
        'Custom Step 1',
        'Custom Step 2',
        'Custom Step 3'
    ]
};

module.exports = async function (context, req) {
    context.log('CreateJob function executed');

    try {
        // Support both camelCase and snake_case for compatibility
        const jobNumber = req.body.jobNumber || req.body.job_number;
        const productType = req.body.productType || req.body.product_type;
        const createdBy = req.body.createdBy || req.body.created_by;
        const assignedTo = req.body.assignedTo || req.body.assigned_to || createdBy;
        
        // Get stages for the product type
        const stages = productStages[productType] || productStages['Custom Job'];
        const totalStages = stages.length;
        
        // Generate title if not provided
        const title = req.body.title || `${productType} Manufacturing Job - ${jobNumber}`;
        
        const jobId = uuidv4();

        // Insert job into database
        await executeQuery(`
            INSERT INTO manufacturing_jobs (
                id, job_number, title, product_type, 
                total_stages, current_stage, status,
                created_by, assigned_to, started_at
            )
            VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10)
        `, [
            jobId, jobNumber, title, productType, 
            totalStages, 1, 'active',
            createdBy, assignedTo, new Date()
        ]);

        // Create all manufacturing steps for this job
        for (let i = 0; i < stages.length; i++) {
            const stepId = uuidv4();
            await executeQuery(`
                INSERT INTO production_steps (
                    id, job_id, step_number, step_name, 
                    description, status, data
                )
                VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7)
            `, [
                stepId,
                jobId,
                i + 1,
                stages[i],
                `Step ${i + 1} of ${productType} manufacturing process`,
                i === 0 ? 'in_progress' : 'pending',
                JSON.stringify({})
            ]);
        }

        // Log system update for real-time polling
        await logSystemUpdate('created', 'job', jobId, {
            jobNumber,
            title,
            status: 'active',
            productType,
            totalStages
        }, createdBy);

        // Return job data with both camelCase and snake_case for compatibility
        const jobData = {
            id: jobId,
            jobNumber,
            job_number: jobNumber,
            title,
            status: 'active',
            productType,
            product_type: productType,
            currentStage: 1,
            current_stage: 1,
            totalStages,
            total_stages: totalStages,
            stages: stages,
            createdBy,
            created_by: createdBy,
            assignedTo,
            assigned_to: assignedTo,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString()
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