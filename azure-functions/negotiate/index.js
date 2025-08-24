const { app } = require('@azure/functions');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');

app.http('negotiate', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const serviceClient = new WebPubSubServiceClient(
                process.env.WebPubSubConnectionString, 
                'manufacturing'
            );
            
            const userId = request.headers['x-user-id'] || 'anonymous';
            const userRole = request.headers['x-user-role'] || 'operator';
            
            const token = await serviceClient.getClientAccessToken({
                userId: userId,
                roles: [`webpubsub.joinLeaveGroup.manufacturing.${userRole}`],
                expirationTimeInMinutes: 60
            });
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    url: token.url,
                    accessToken: token.token
                })
            };
        } catch (error) {
            context.log.error('Negotiate error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to negotiate connection',
                    message: error.message 
                })
            };
        }
    }
});