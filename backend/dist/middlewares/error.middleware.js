export function errorMiddleware(err, req, res, _next) {
    // Handle Zod validation errors
    if (err.name === 'ZodError' || err.issues) {
        return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            errors: err.issues?.map((i) => ({
                path: i.path.join('.'),
                message: i.message
            })),
            requestId: req.requestId
        });
    }
    const status = err.statusCode ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    const message = status === 500 ? 'Internal Server Error' : (err.message ?? 'Internal Server Error');
    console.error(JSON.stringify({
        requestId: req.requestId,
        status,
        code,
        message: err.message,
        stack: err.stack
    }));
    res.status(status).json({
        code,
        message,
        requestId: req.requestId
    });
}
