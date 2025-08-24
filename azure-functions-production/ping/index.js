module.exports = async function (context, req) {
    context.log('Ping function executed');

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString(),
            server: 'azure-functions-production'
        })
    };
};