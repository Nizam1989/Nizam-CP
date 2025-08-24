const { app } = require('@azure/functions');
const { Connection } = require('tedious');

app.http('testDb', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Testing database connection...');
        
        try {
            const config = {
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
                    connectTimeout: 30000,
                    requestTimeout: 30000
                }
            };

            return new Promise((resolve) => {
                const connection = new Connection(config);
                
                const timeout = setTimeout(() => {
                    context.log('Connection timeout after 25 seconds');
                    resolve({
                        status: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            success: false,
                            error: 'Connection timeout'
                        })
                    });
                }, 25000);

                connection.on('connect', (err) => {
                    clearTimeout(timeout);
                    if (err) {
                        context.log('Connection error:', err);
                        resolve({
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                success: false,
                                error: err.message
                            })
                        });
                    } else {
                        context.log('Database connected successfully');
                        connection.close();
                        resolve({
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                success: true,
                                message: 'Database connection successful'
                            })
                        });
                    }
                });

                connection.connect();
            });
        } catch (error) {
            context.log('Catch error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: error.message
                })
            };
        }
    }
});