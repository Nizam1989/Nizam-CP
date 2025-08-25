module.exports = async function (context, req) {
    context.log('SignOut function executed');

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '3600'
            },
            body: ''
        };
        return;
    }

    try {
        // For JWT tokens, we just return success since tokens are stateless
        // In a production environment, you might want to implement token blacklisting
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Successfully signed out'
            })
        };

    } catch (error) {
        context.log.error('Error in signOut:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Sign out failed',
                details: error.message
            })
        };
    }
};