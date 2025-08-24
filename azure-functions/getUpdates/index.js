const { app } = require('@azure/functions');
const { dbUtils } = require('../shared/database');

app.http('getUpdates', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Get updates request received');

        try {
            const url = new URL(request.url);
            const since = url.searchParams.get('since');
            
            if (!since) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Missing required parameter: since (ISO timestamp)'
                    })
                };
            }

            // Parse the timestamp
            const sinceDate = new Date(since);
            if (isNaN(sinceDate.getTime())) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid timestamp format for since parameter'
                    })
                };
            }

            // Get recent updates
            const updates = await dbUtils.getRecentUpdates(sinceDate.toISOString());
            
            // Transform updates for frontend consumption
            const transformedUpdates = updates.map(update => ({
                id: update.id,
                type: update.update_type,
                entityType: update.entity_type,
                entityId: update.entity_id,
                data: update.data,
                createdBy: update.created_by,
                createdAt: update.created_at
            }));

            context.log(`Returning ${transformedUpdates.length} updates since ${since}`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: JSON.stringify({
                    success: true,
                    data: transformedUpdates,
                    meta: {
                        count: transformedUpdates.length,
                        since: since,
                        serverTime: new Date().toISOString()
                    }
                })
            };

        } catch (error) {
            context.log.error('Error getting updates:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to get updates',
                    message: error.message
                })
            };
        }
    }
});