const { app } = require('@azure/functions');
const { dbUtils } = require('../shared/database');

app.http('initDatabase', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Initialize database request received');

        try {
            // Initialize the database schema
            await dbUtils.initializeSchema();
            
            context.log('Database initialized successfully');
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Database initialized successfully',
                    timestamp: new Date().toISOString()
                })
            };
            
        } catch (error) {
            context.log.error('Database initialization error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Database initialization failed',
                    message: error.message
                })
            };
        }
    }
});