module.exports = async function (context, req) {
    context.log('Test function triggered');

    const responseMessage = {
        success: true,
        message: 'Test function is working',
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