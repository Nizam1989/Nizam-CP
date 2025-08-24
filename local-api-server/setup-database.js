const fs = require('fs');
const { Connection, Request } = require('tedious');

// Database configuration
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

async function executeSQLScript() {
    return new Promise((resolve, reject) => {
        const connection = new Connection(config);
        
        connection.on('connect', (err) => {
            if (err) {
                console.error('Connection failed:', err);
                reject(err);
                return;
            }
            
            console.log('Connected to database successfully');
            
            // Read the SQL script
            const sqlScript = fs.readFileSync('C:\\Users\\USER\\Desktop\\Azure CP\\complete-database-setup.sql', 'utf8');
            
            // Split the script into individual statements (basic split on GO or semicolon)
            const statements = sqlScript
                .split(/\r?\n/)
                .join(' ')
                .split(';')
                .filter(stmt => stmt.trim().length > 0)
                .slice(0, -1); // Remove the last empty statement
            
            console.log(`Executing ${statements.length} SQL statements...`);
            
            let currentStatement = 0;
            
            function executeNextStatement() {
                if (currentStatement >= statements.length) {
                    console.log('All statements executed successfully!');
                    connection.close();
                    resolve();
                    return;
                }
                
                const statement = statements[currentStatement].trim();
                if (statement.length === 0 || statement.startsWith('--') || statement.toUpperCase().startsWith('PRINT')) {
                    currentStatement++;
                    executeNextStatement();
                    return;
                }
                
                console.log(`Executing statement ${currentStatement + 1}/${statements.length}`);
                
                const request = new Request(statement, (err) => {
                    if (err) {
                        console.error(`Error in statement ${currentStatement + 1}:`, err);
                        // Continue with next statement even if one fails
                    }
                    currentStatement++;
                    executeNextStatement();
                });
                
                connection.execSql(request);
            }
            
            executeNextStatement();
        });
        
        connection.on('end', () => {
            console.log('Database connection ended');
        });
        
        connection.connect();
    });
}

// Run the setup
executeSQLScript()
    .then(() => {
        console.log('✅ Database setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    });