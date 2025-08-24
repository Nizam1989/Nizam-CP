module.exports = async function (context, req) {
    context.log('Diagnose function triggered');

    try {
        // Test 1: Basic response
        const basicTest = {
            timestamp: new Date().toISOString(),
            method: req.method,
            nodeVersion: process.version,
            platform: process.platform
        };

        // Test 2: Environment variables
        const envTest = {
            hasWorkerRuntime: !!process.env.FUNCTIONS_WORKER_RUNTIME,
            hasSqlServer: !!process.env.SQL_SERVER,
            hasSqlDatabase: !!process.env.SQL_DATABASE,
            hasSqlUsername: !!process.env.SQL_USERNAME,
            hasSqlPassword: !!process.env.SQL_PASSWORD,
            hasStorageConnection: !!process.env.AZURE_STORAGE_CONNECTION_STRING
        };

        // Test 3: SQL Server connectivity (without actual connection)
        const sqlConfig = {
            server: process.env.SQL_SERVER || 'not-set',
            database: process.env.SQL_DATABASE || 'not-set',
            username: process.env.SQL_USERNAME || 'not-set',
            hasPassword: !!process.env.SQL_PASSWORD
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Diagnostic function working',
                tests: {
                    basic: basicTest,
                    environment: envTest,
                    sqlConfig: sqlConfig
                }
            }, null, 2)
        };

    } catch (error) {
        context.log.error('Diagnostic function error:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack
            })
        };
    }
};