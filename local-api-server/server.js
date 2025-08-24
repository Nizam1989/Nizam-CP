const express = require('express');
const cors = require('cors');
const { Connection, Request, TYPES } = require('tedious');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const dbConfig = {
    server: 'nizam-cp-sql.database.windows.net',
    authentication: {
        type: 'default',
        options: {
            userName: 'sandscreen',
            password: 'ManufacturingSQL2024!'
        }
    },
    options: {
        database: 'manufacturing',
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 15000,
        requestTimeout: 15000,
        rowCollectionOnRequestCompletion: true
    }
};

// Database utility functions
async function executeQuery(queryText, params = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(dbConfig);
        const results = [];

        connection.on('connect', (err) => {
            if (err) {
                console.error('Database connection error:', err);
                reject(err);
                return;
            }

            const request = new Request(queryText, (err, rowCount) => {
                if (err) {
                    console.error('Query execution error:', err);
                    reject(err);
                } else {
                    resolve({ rows: results, rowCount });
                }
                connection.close();
            });

            // Add parameters
            if (params && params.length > 0) {
                params.forEach((param, index) => {
                    let type = TYPES.NVarChar;
                    let value = param;

                    if (typeof param === 'number') {
                        type = Number.isInteger(param) ? TYPES.Int : TYPES.Float;
                    } else if (typeof param === 'boolean') {
                        type = TYPES.Bit;
                    } else if (param instanceof Date) {
                        type = TYPES.DateTime2;
                    } else if (typeof param === 'string' && param.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                        type = TYPES.UniqueIdentifier;
                    }

                    request.addParameter(`param${index + 1}`, type, value);
                });
            }

            request.on('row', (columns) => {
                const row = {};
                columns.forEach((column) => {
                    row[column.metadata.colName] = column.value;
                });
                results.push(row);
            });

            connection.execSql(request);
        });

        connection.on('end', () => {
            console.log('Database connection ended');
        });

        connection.connect();
    });
}

// Log system update for real-time polling
async function logSystemUpdate(updateType, entityType, entityId, data, createdBy = null) {
    try {
        await executeQuery(
            'INSERT INTO system_updates (update_type, entity_type, entity_id, data, created_by) VALUES (@param1, @param2, @param3, @param4, @param5)',
            [updateType, entityType, entityId, JSON.stringify(data), createdBy]
        );
    } catch (error) {
        console.error('Error logging system update:', error);
    }
}

// API Routes

// Health check
app.get('/api/ping', (req, res) => {
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        server: 'local-api-server',
        status: 'healthy'
    });
});

// Initialize database
app.get('/api/initdatabase', async (req, res) => {
    try {
        console.log('Initializing database...');
        
        // Test connection
        const testResult = await executeQuery('SELECT 1 as test');
        
        if (testResult.rows.length > 0) {
            res.json({
                success: true,
                message: 'Database connection successful and ready',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Database connection test failed');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Database initialization failed',
            details: error.message
        });
    }
});

// Get all jobs
app.get('/api/getjobs', async (req, res) => {
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
                completed: job.currentStage - 1,
                total: job.totalStages
            }
        }));

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('Error getting jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve jobs'
        });
    }
});

// Create new job
app.post('/api/createjob', async (req, res) => {
    try {
        const { jobNumber, title, productType, createdBy, totalStages = 5 } = req.body;
        const jobId = uuidv4();

        await executeQuery(`
            INSERT INTO manufacturing_jobs (id, job_number, title, product_type, total_stages, created_by)
            VALUES (@param1, @param2, @param3, @param4, @param5, @param6)
        `, [jobId, jobNumber, title, productType, totalStages, createdBy]);

        // Log system update
        await logSystemUpdate('created', 'job', jobId, {
            jobNumber,
            title,
            status: 'draft',
            productType
        }, createdBy);

        res.json({
            success: true,
            data: {
                id: jobId,
                jobNumber,
                title,
                status: 'draft',
                productType,
                currentStage: 1,
                totalStages,
                createdBy,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create job'
        });
    }
});

// Update production step
app.put('/api/updatestep', async (req, res) => {
    try {
        const { jobId, stepNumber, status, completedBy } = req.body;

        // First, get or create the step
        let stepResult = await executeQuery(`
            SELECT id FROM production_steps 
            WHERE job_id = @param1 AND step_number = @param2
        `, [jobId, stepNumber]);

        let stepId;
        if (stepResult.rows.length === 0) {
            // Create the step
            stepId = uuidv4();
            await executeQuery(`
                INSERT INTO production_steps (id, job_id, step_number, step_name, description, status, assigned_to, completed_by, completed_at)
                VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
                stepId, 
                jobId, 
                stepNumber, 
                `Step ${stepNumber}`,
                `Production step ${stepNumber}`,
                status,
                completedBy,
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
            `, [status, completedBy, status === 'completed' ? new Date() : null, stepId]);
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

        res.json({
            success: true,
            data: {
                stepId,
                jobId,
                stepNumber,
                status,
                completedBy,
                completedAt: status === 'completed' ? new Date().toISOString() : null
            }
        });
    } catch (error) {
        console.error('Error updating step:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update production step'
        });
    }
});

// Get recent updates for polling
app.get('/api/getupdates', async (req, res) => {
    try {
        const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default: last 24 hours
        
        const result = await executeQuery(`
            SELECT 
                id,
                update_type as type,
                entity_type as entityType,
                entity_id as entityId,
                data,
                created_by as createdBy,
                created_at as createdAt
            FROM system_updates 
            WHERE created_at > @param1 
            ORDER BY created_at DESC
        `, [new Date(since)]);

        // Parse JSON data for each update
        const updates = result.rows.map(update => ({
            ...update,
            data: typeof update.data === 'string' ? JSON.parse(update.data) : update.data
        }));

        res.json({
            success: true,
            data: updates
        });
    } catch (error) {
        console.error('Error getting updates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve updates'
        });
    }
});

// Generate PDF (mock implementation)
app.post('/api/generatepdf', async (req, res) => {
    try {
        const { jobId, templateType, formData } = req.body;
        
        // Mock PDF generation
        const fileName = `${jobId}-${templateType}-${Date.now()}.pdf`;
        
        // Insert PDF report record
        const reportId = uuidv4();
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

        res.json({
            success: true,
            data: {
                reportId,
                fileName,
                templateType,
                pdfUrl: `https://nizamcpstorage44793.blob.core.windows.net/manufacturing-pdfs/${fileName}`,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PDF'
        });
    }
});

// Test database connection
app.get('/api/testdb', async (req, res) => {
    try {
        const result = await executeQuery('SELECT COUNT(*) as count FROM manufacturing_jobs');
        
        res.json({
            success: true,
            message: 'Database connection successful',
            jobCount: result.rows[0].count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Manufacturing API Server running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /api/ping - Health check`);
    console.log(`   GET  /api/initdatabase - Initialize database`);
    console.log(`   GET  /api/getjobs - Get all manufacturing jobs`);
    console.log(`   POST /api/createjob - Create new job`);
    console.log(`   PUT  /api/updatestep - Update production step`);
    console.log(`   GET  /api/getupdates - Get recent updates for polling`);
    console.log(`   POST /api/generatepdf - Generate PDF report`);
    console.log(`   GET  /api/testdb - Test database connection`);
    console.log(`\n💡 To use with React app, update .env to:`);
    console.log(`   VITE_API_BASE_URL=http://localhost:${PORT}/api`);
});

module.exports = app;