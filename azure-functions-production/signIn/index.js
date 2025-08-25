const { executeQuery, uuidv4 } = require('../shared/database');
const crypto = require('crypto');

// Simple JWT implementation (for production, use a proper JWT library)
function generateToken(user) {
    const header = {
        "alg": "HS256",
        "typ": "JWT"
    };
    
    const payload = {
        "userId": user.user_id,
        "email": user.email,
        "role": user.role_type,
        "iat": Math.floor(Date.now() / 1000),
        "exp": Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const secret = process.env.JWT_SECRET || 'manufacturing-system-secret-key-2024';
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(encodedHeader + '.' + encodedPayload)
        .digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    return encodedHeader + '.' + encodedPayload + '.' + signature;
}

// Simple password hashing
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = async function (context, req) {
    context.log('SignIn function executed');

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '3600'
            },
            body: ''
        };
        return;
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Email and password are required'
                })
            };
            return;
        }

        // Check if user exists
        const userResult = await executeQuery(`
            SELECT user_id, email, full_name, role_type, status, password_hash, created_at
            FROM user_roles 
            WHERE email = @param1
        `, [email.toLowerCase()]);

        if (userResult.rows.length === 0) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid email or password'
                })
            };
            return;
        }

        const user = userResult.rows[0];
        const hashedPassword = hashPassword(password);

        // Verify password
        if (user.password_hash !== hashedPassword) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid email or password'
                })
            };
            return;
        }

        // Check if user is approved
        if (user.status !== 'active' && user.status !== 'approved') {
            context.res = {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Account is pending approval or has been deactivated'
                })
            };
            return;
        }

        // Generate JWT token
        const token = generateToken(user);

        // Update last login
        await executeQuery(`
            UPDATE user_roles 
            SET last_login = @param1 
            WHERE user_id = @param2
        `, [new Date(), user.user_id]);

        // Return success with user data and token
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: user.user_id,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role_type,
                        status: user.status,
                        created_at: user.created_at
                    },
                    token: token
                }
            })
        };

    } catch (error) {
        context.log.error('Error in signIn:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Authentication failed',
                details: error.message
            })
        };
    }
};