module.exports = async function (context, req) {
    context.log('Simple test function triggered');

    const responseMessage = {
        message: 'Hello from simple test!',
        timestamp: new Date().toISOString()
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseMessage)
    };
};