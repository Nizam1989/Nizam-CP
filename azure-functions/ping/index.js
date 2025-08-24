module.exports = async function (context, req) {
    context.log('Ping function triggered');

    const responseMessage = {
        message: 'pong',
        timestamp: new Date().toISOString()
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(responseMessage)
    };
};