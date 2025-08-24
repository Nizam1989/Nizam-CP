const { Connection, Request, TYPES } = require('tedious');

class DatabaseConnection {
    constructor() {
        this.config = {
            server: process.env.SQL_SERVER || 'nizam-cp-sql.database.windows.net',
            authentication: {
                type: 'default',
                options: {
                    userName: process.env.SQL_USERNAME || 'sandscreen',
                    password: process.env.SQL_PASSWORD || 'ManufacturingSQL2024!'
                }
            },
            options: {
                database: process.env.SQL_DATABASE || 'manufacturing',
                encrypt: true,
                trustServerCertificate: false,
                connectTimeout: 15000,
                requestTimeout: 15000,
                rowCollectionOnRequestCompletion: true
            }
        };
    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            const connection = new Connection(this.config);
            
            connection.on('connect', (err) => {
                if (err) {
                    console.error('Connection error:', err);
                    reject(err);
                } else {
                    console.log('Successfully connected to SQL Server');
                    resolve(true);
                }
                connection.close();
            });

            connection.on('end', () => {
                console.log('Connection ended');
            });

            connection.connect();
        });
    }

    async query(queryText, params = []) {
        return new Promise((resolve, reject) => {
            const connection = new Connection(this.config);
            const results = [];

            connection.on('connect', (err) => {
                if (err) {
                    console.error('Connection error:', err);
                    reject(err);
                    return;
                }

                const request = new Request(queryText, (err, rowCount) => {
                    if (err) {
                        console.error('Query error:', err);
                        reject(err);
                    } else {
                        console.log(`Query completed. ${rowCount} rows affected.`);
                        resolve({ rows: results, rowCount });
                    }
                    connection.close();
                });

                // Add parameters
                if (params && params.length > 0) {
                    params.forEach((param, index) => {
                        let type = TYPES.NVarChar;
                        let value = param;

                        // Determine parameter type
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
                console.log('Connection ended');
            });

            connection.connect();
        });
    }
}

// Database utility functions
const db = new DatabaseConnection();

const dbUtils = {
    // Test connection
    async testConnection() {
        return await db.testConnection();
    },

    // Initialize database schema
    async initializeSchema() {
        try {
            console.log('Starting database schema initialization...');
            
            // First, test the connection
            await db.testConnection();
            console.log('Database connection successful');
            
            // Check if tables exist
            const tableCheck = await db.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'manufacturing_jobs'
            `);

            if (tableCheck.rows[0].count === 0) {
                console.log('Creating manufacturing tables...');
                
                // Create tables one by one to avoid transaction issues
                await db.query(`
                    CREATE TABLE manufacturing_jobs (
                        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
                        job_number VARCHAR(50) UNIQUE NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        status VARCHAR(50) DEFAULT 'draft',
                        created_by VARCHAR(255) NOT NULL,
                        created_at DATETIME2 DEFAULT GETDATE(),
                        updated_at DATETIME2 DEFAULT GETDATE()
                    );
                `);
                console.log('Created manufacturing_jobs table');

                await db.query(`
                    CREATE TABLE production_steps (
                        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
                        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
                        step_number INT NOT NULL,
                        description VARCHAR(500),
                        status VARCHAR(50) DEFAULT 'pending',
                        assigned_to VARCHAR(255),
                        completed_by VARCHAR(255),
                        completed_at DATETIME2 NULL,
                        created_at DATETIME2 DEFAULT GETDATE()
                    );
                `);
                console.log('Created production_steps table');

                await db.query(`
                    CREATE TABLE quality_notifications (
                        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
                        job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
                        notification_type VARCHAR(100),
                        message TEXT,
                        severity VARCHAR(20) DEFAULT 'info',
                        created_by VARCHAR(255),
                        created_at DATETIME2 DEFAULT GETDATE()
                    );
                `);
                console.log('Created quality_notifications table');

                await db.query(`
                    CREATE TABLE user_roles (
                        user_id VARCHAR(255) PRIMARY KEY,
                        role_type VARCHAR(50) NOT NULL,
                        permissions TEXT,
                        created_at DATETIME2 DEFAULT GETDATE()
                    );
                `);
                console.log('Created user_roles table');

                await db.query(`
                    CREATE TABLE system_updates (
                        id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
                        update_type VARCHAR(100) NOT NULL,
                        entity_type VARCHAR(100) NOT NULL,
                        entity_id uniqueidentifier NOT NULL,
                        data NVARCHAR(MAX) NOT NULL,
                        created_by VARCHAR(255),
                        created_at DATETIME2 DEFAULT GETDATE()
                    );
                `);
                console.log('Created system_updates table');

                // Create indexes
                await db.query(`CREATE INDEX idx_manufacturing_jobs_status ON manufacturing_jobs(status);`);
                await db.query(`CREATE INDEX idx_manufacturing_jobs_created_at ON manufacturing_jobs(created_at DESC);`);
                await db.query(`CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC);`);
                
                console.log('Created indexes');

                // Insert sample user roles
                await db.query(`
                    INSERT INTO user_roles (user_id, role_type) VALUES 
                    ('sandscreencp@outlook.com', 'super_admin'),
                    ('user1@company.com', 'manager'),
                    ('user2@company.com', 'engineer');
                `);
                console.log('Inserted sample user roles');

                console.log('Database schema created successfully');
            } else {
                console.log('Database tables already exist');
            }

            return { success: true, message: 'Database initialized successfully' };

        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    },

    // Log system update for real-time polling
    async logSystemUpdate(updateType, entityType, entityId, data, createdBy = null) {
        try {
            await db.query(
                'INSERT INTO system_updates (update_type, entity_type, entity_id, data, created_by) VALUES (@param1, @param2, @param3, @param4, @param5)',
                [updateType, entityType, entityId, JSON.stringify(data), createdBy]
            );
        } catch (error) {
            console.error('Error logging system update:', error);
        }
    },

    // Get recent updates for polling
    async getRecentUpdates(since) {
        const result = await db.query(
            'SELECT * FROM system_updates WHERE created_at > @param1 ORDER BY created_at DESC',
            [new Date(since)]
        );
        return result.rows;
    }
};

module.exports = { db, dbUtils };