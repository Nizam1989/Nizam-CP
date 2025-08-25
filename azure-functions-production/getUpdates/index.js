const { executeQuery } = require('../shared/database');

module.exports = async function (context, req) {
    context.log('GetUpdates function executed');

    try {
        const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const limit = parseInt(req.query.limit) || 100; // Add limit to prevent large result sets
        
        const result = await executeQuery(`
            SELECT TOP (@param2)
                id,
                update_type as type,
                entity_type as entityType,
                entity_id as entityId,
                data,
                created_by as createdBy,
                created_at as createdAt
            FROM system_updates 
            WHERE created_at > @param1 
            ORDER BY created_at DESC
        `, [new Date(since), limit]);

        // Parse JSON data for each update
        const updates = result.rows.map(update => {
            try {
                return {
                    ...update,
                    data: typeof update.data === 'string' ? JSON.parse(update.data) : update.data
                };
            } catch (parseError) {
                context.log.warn('Failed to parse update data:', parseError);
                return {
                    ...update,
                    data: update.data // Return unparsed data if JSON parsing fails
                };
            }
        });

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: updates
            })
        };

    } catch (error) {
        context.log.error('Error getting updates:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve updates',
                details: error.message
            })
        };
    }
};