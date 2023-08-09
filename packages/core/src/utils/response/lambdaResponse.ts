import createHttpError from 'http-errors';

export const errorResponse = (statusCode: number, message: string) => {
    return createHttpError(statusCode, message);
};

export const response = (statusCode: number, body?: object) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
    };
};
