const { Connection, Request, TYPES } = require('tedious');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const getDbConfig = () => ({
    server: process.env.SQL_SERVER,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.SQL_USERNAME,
            password: process.env.SQL_PASSWORD
        }
    },
    options: {
        database: process.env.SQL_DATABASE,
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 15000,
        requestTimeout: 15000,
        rowCollectionOnRequestCompletion: true
    }
});

// Execute query utility
async function executeQuery(queryText, params = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(getDbConfig());
        const results = [];

        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }

            const request = new Request(queryText, (err, rowCount) => {
                if (err) {
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

        connection.connect();
    });
}

// Log system update
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

module.exports = {
    executeQuery,
    logSystemUpdate,
    uuidv4
};