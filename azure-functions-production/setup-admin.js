// Set environment variables from local.settings.json
process.env.SQL_SERVER = 'nizam-cp-sql.database.windows.net';
process.env.SQL_DATABASE = 'manufacturing';
process.env.SQL_USERNAME = 'sandscreen';
process.env.SQL_PASSWORD = 'ManufacturingSQL2024!';

const { executeQuery, uuidv4 } = require('./shared/database');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
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
            SELECT user_id FROM user_roles WHERE email = @param1
        `, ['sandscreencp@outlook.com']);

        if (existingUser.rows.length > 0) {
            // Update existing admin user
            await executeQuery(`
                UPDATE user_roles 
                SET password_hash = @param1, 
                    status = 'active', 
                    role_type = 'super_admin',
                    full_name = 'System Administrator'
                WHERE email = @param2
            `, [hashedPassword, 'sandscreencp@outlook.com']);
            
            console.log('✅ Updated existing admin user');
        } else {
            // Create new admin user
            await executeQuery(`
                INSERT INTO user_roles (user_id, email, full_name, role_type, status, password_hash, created_at)
                VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7)
            `, [
                'sandscreencp@outlook.com',
                'sandscreencp@outlook.com',
                'System Administrator',
                'super_admin',
                'active',
                hashedPassword,
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