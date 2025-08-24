const { Connection, Request } = require('tedious');

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

async function executeStatement(sql) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);
        
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const request = new Request(sql, (err) => {
                if (err) {
                    console.error(`Error executing: ${sql.substring(0, 50)}...`, err.message);
                    reject(err);
                } else {
                    console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
                    resolve();
                }
                connection.close();
            });
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}

async function initializeTables() {
    console.log('🚀 Starting database table initialization...');
    
    const statements = [
        // Manufacturing Jobs Table
        `CREATE TABLE manufacturing_jobs (
            id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            job_number VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'draft',
            product_type VARCHAR(100) DEFAULT 'Widget',
            current_stage INT DEFAULT 1,
            total_stages INT DEFAULT 5,
            created_by VARCHAR(255) NOT NULL,
            assigned_to VARCHAR(255),
            started_at DATETIME2 NULL,
            completed_at DATETIME2 NULL,
            hold_reason VARCHAR(500) NULL,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
        )`,
        
        // Production Steps Table
        `CREATE TABLE production_steps (
            id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
            step_number INT NOT NULL,
            step_name VARCHAR(100) NOT NULL,
            description VARCHAR(500),
            data NVARCHAR(MAX),
            status VARCHAR(50) DEFAULT 'pending',
            assigned_to VARCHAR(255),
            completed_by VARCHAR(255),
            completed_at DATETIME2 NULL,
            skipped_by VARCHAR(255),
            skipped_at DATETIME2 NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )`,
        
        // Quality Notifications Table
        `CREATE TABLE quality_notifications (
            id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            notification_type VARCHAR(100),
            message TEXT,
            severity VARCHAR(20) DEFAULT 'info',
            status VARCHAR(50) DEFAULT 'open',
            created_by VARCHAR(255),
            assigned_to VARCHAR(255),
            resolved_by VARCHAR(255),
            resolved_at DATETIME2 NULL,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
        )`,
        
        // User Roles Table
        `CREATE TABLE user_roles (
            user_id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            permissions TEXT,
            approved_by VARCHAR(255),
            approved_at DATETIME2,
            created_at DATETIME2 DEFAULT GETDATE()
        )`,
        
        // System Updates Table
        `CREATE TABLE system_updates (
            id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            update_type VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id uniqueidentifier NOT NULL,
            data NVARCHAR(MAX) NOT NULL,
            created_by VARCHAR(255),
            created_at DATETIME2 DEFAULT GETDATE()
        )`,
        
        // PDF Reports Table
        `CREATE TABLE pdf_reports (
            id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            job_id uniqueidentifier REFERENCES manufacturing_jobs(id),
            file_name VARCHAR(255) NOT NULL,
            generated_by VARCHAR(255) NOT NULL,
            generated_at DATETIME2 DEFAULT GETDATE()
        )`
    ];
    
    for (const statement of statements) {
        try {
            await executeStatement(statement);
        } catch (error) {
            // Continue even if table already exists
            if (!error.message.includes('already an object named')) {
                console.error('Failed to create table:', error.message);
            }
        }
    }
    
    console.log('📊 Creating indexes...');
    
    const indexes = [
        `CREATE INDEX idx_manufacturing_jobs_status ON manufacturing_jobs(status)`,
        `CREATE INDEX idx_manufacturing_jobs_created_at ON manufacturing_jobs(created_at DESC)`,
        `CREATE INDEX idx_system_updates_created_at ON system_updates(created_at DESC)`,
        `CREATE INDEX idx_production_steps_job_id ON production_steps(job_id, step_number)`
    ];
    
    for (const index of indexes) {
        try {
            await executeStatement(index);
        } catch (error) {
            // Indexes may already exist, continue
            console.log('Index creation skipped:', error.message);
        }
    }
    
    console.log('💾 Inserting sample data...');
    
    // Insert sample users
    try {
        await executeStatement(`
            INSERT INTO user_roles (user_id, email, full_name, role_type, status, permissions, approved_by, approved_at) VALUES
            ('sandscreencp@outlook.com', 'sandscreencp@outlook.com', 'System Administrator', 'super_admin', 'active', '{"all": true}', 'system', GETDATE()),
            ('user1@company.com', 'user1@company.com', 'Production Manager', 'manager', 'active', '{"jobs": ["create", "read", "update", "delete"]}', 'sandscreencp@outlook.com', GETDATE()),
            ('user2@company.com', 'user2@company.com', 'Manufacturing Engineer', 'engineer', 'active', '{"jobs": ["create", "read", "update"]}', 'sandscreencp@outlook.com', GETDATE()),
            ('operator1@company.com', 'operator1@company.com', 'Machine Operator', 'operator', 'active', '{"jobs": ["read"], "steps": ["read", "update"]}', 'user1@company.com', GETDATE()),
            ('inspector@company.com', 'inspector@company.com', 'Quality Inspector', 'inspector', 'active', '{"notifications": ["create", "read", "update"]}', 'user1@company.com', GETDATE())
        `);
    } catch (error) {
        console.log('Sample users may already exist:', error.message);
    }
    
    // Insert sample jobs
    try {
        await executeStatement(`
            INSERT INTO manufacturing_jobs (job_number, title, status, product_type, current_stage, total_stages, created_by, assigned_to, started_at) VALUES
            ('JOB-001', 'Widget Assembly Line A', 'in_progress', 'Widget', 2, 5, 'sandscreencp@outlook.com', 'operator1@company.com', DATEADD(day, -2, GETDATE())),
            ('JOB-002', 'Quality Check Batch 101', 'draft', 'Component', 1, 4, 'user1@company.com', 'inspector@company.com', NULL),
            ('JOB-003', 'Final Inspection Round 1', 'completed', 'Assembly', 5, 5, 'inspector@company.com', 'inspector@company.com', DATEADD(day, -5, GETDATE())),
            ('JOB-004', 'Component Testing Suite', 'in_progress', 'Component', 3, 6, 'user2@company.com', 'user2@company.com', DATEADD(day, -3, GETDATE())),
            ('JOB-005', 'Assembly Validation Run', 'on_hold', 'Assembly', 2, 4, 'operator1@company.com', 'operator1@company.com', DATEADD(day, -1, GETDATE()))
        `);
    } catch (error) {
        console.log('Sample jobs may already exist:', error.message);
    }
    
    console.log('✅ Database initialization completed successfully!');
    
    // Verify setup
    try {
        const connection = new Connection(config);
        connection.on('connect', () => {
            const request = new Request('SELECT COUNT(*) as count FROM manufacturing_jobs', (err) => {
                if (err) {
                    console.error('Verification failed:', err);
                } else {
                    console.log('📋 Database verification completed');
                }
                connection.close();
                process.exit(0);
            });
            
            request.on('row', (columns) => {
                console.log(`📊 Total jobs in database: ${columns[0].value}`);
            });
            
            connection.execSql(request);
        });
        connection.connect();
    } catch (error) {
        console.error('Verification error:', error);
        process.exit(1);
    }
}

initializeTables().catch(console.error);