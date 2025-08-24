const { Connection, Request, TYPES } = require('tedious');
const crypto = require('crypto');

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
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    }
};

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function executeQuery(query, parameters = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);
        
        connection.on('connect', (err) => {
            if (err) {
                console.error('Connection error:', err);
                reject(err);
                return;
            }

            const request = new Request(query, (err, rowCount, rows) => {
                connection.close();
                if (err) {
                    console.error('Query error:', err);
                    reject(err);
                } else {
                    const result = rows ? rows.map(row => {
                        const obj = {};
                        row.forEach(col => {
                            obj[col.metadata.colName] = col.value;
                        });
                        return obj;
                    }) : [];
                    resolve({ rowCount, rows: result });
                }
            });

            // Add parameters
            parameters.forEach((param, index) => {
                request.addParameter(`param${index + 1}`, TYPES.NVarChar, param);
            });

            connection.execSql(request);
        });

        connection.connect();
    });
}

async function setupAdminUser() {
    try {
        console.log('Setting up admin user...');

        // First ensure the user_roles table has the correct structure
        const alterTableQuery = `
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'password_hash')
        BEGIN
            ALTER TABLE user_roles ADD password_hash NVARCHAR(255);
        END

        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'last_login')
        BEGIN
            ALTER TABLE user_roles ADD last_login DATETIME2;
        END
        `;

        await executeQuery(alterTableQuery);
        console.log('✅ Table structure verified');

        // Hash the admin password
        const hashedPassword = hashPassword('Nizam187@');
        
        // Check if admin user already exists
        const existingUser = await executeQuery(`
            SELECT id FROM user_roles WHERE email = @param1
        `, ['sandscreencp@outlook.com']);

        if (existingUser.rows.length > 0) {
            // Update existing admin user
            await executeQuery(`
                UPDATE user_roles 
                SET password_hash = @param1, 
                    status = 'active', 
                    role = 'admin',
                    full_name = 'System Administrator'
                WHERE email = @param2
            `, [hashedPassword, 'sandscreencp@outlook.com']);
            
            console.log('✅ Updated existing admin user');
        } else {
            // Create new admin user
            const adminId = crypto.randomUUID();
            await executeQuery(`
                INSERT INTO user_roles (id, email, full_name, role, status, password_hash, created_at, updated_at)
                VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
            `, [
                adminId,
                'sandscreencp@outlook.com',
                'System Administrator',
                'admin',
                'active',
                hashedPassword,
                new Date(),
                new Date()
            ]);
            
            console.log('✅ Created new admin user');
        }

        console.log('🎉 Admin user setup complete!');
        console.log('📧 Email: sandscreencp@outlook.com');
        console.log('🔐 Password: Nizam187@');
        console.log('👤 Role: admin');
        
    } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        process.exit(1);
    }
}

setupAdminUser();