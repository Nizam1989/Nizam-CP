const { executeQuery } = require('../shared/database');
const crypto = require('crypto');

// JWT verification function
function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET || 'manufacturing-system-secret-key-2024';
        const parts = token.split('.');
        
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(encodedHeader + '.' + encodedPayload)
            .digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        if (signature !== expectedSignature) {
            return null;
        }

        // Decode payload (convert base64url back to base64)
        const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64Payload.length % 4)) % 4);
        const payload = JSON.parse(Buffer.from(base64Payload + padding, 'base64').toString());
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
}

module.exports = async function (context, req) {
    context.log('GetCurrentUser function executed');

    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization || req.headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'No valid authorization token provided'
                })
            };
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyToken(token);

        if (!decoded) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid or expired token'
                })
            };
            return;
        }

        // Get current user data from database
        const userResult = await executeQuery(`
            SELECT user_id, email, full_name, role_type, status, created_at, last_login
            FROM user_roles 
            WHERE user_id = @param1 AND status IN ('active', 'approved')
        `, [decoded.userId]);

        if (userResult.rows.length === 0) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'User not found or inactive'
                })
            };
            return;
        }

        const user = userResult.rows[0];

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role_type,
                    status: user.status,
                    created_at: user.created_at,
                    last_login: user.last_login
                }
            })
        };

    } catch (error) {
        context.log.error('Error in getCurrentUser:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to get current user',
                details: error.message
            })
        };
    }
};