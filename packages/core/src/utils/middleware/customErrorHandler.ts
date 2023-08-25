import middy from '@middy/core';
import { HttpError } from '../../utils/response';

export const customErrorHandler = (): middy.MiddlewareObj => {
    const onError: middy.MiddlewareFn = async (request) => {
        const err = <any>request.error;

        if (err instanceof HttpError) {
            const errorResponse = {
                status: err.statusCode,
                message: err.message,
                developerMessage: err.developerMessage || err.message,
            };
            request.response = {
                statusCode: err.statusCode,
                body: JSON.stringify(errorResponse),
            };
            return;
        }

        request.response = {
            statusCode: 500,
            body: JSON.stringify({
                status: 500,
                message: 'An unexpected error occurred',
                developerMessage: err.message || 'An unexpected error occurred',
            }),
        };
    };

    return {
        onError,
    };
};
