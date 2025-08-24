module.exports = async function (context, req) {
    context.log('SignOut function executed');

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