import middy from '@middy/core';
import createHttpError from 'http-errors';
import { checkUserSpaceMembership } from '../../dynamodb';

export const authorizeUserSpaceMembership = (): middy.MiddlewareObj => {
    const before: middy.MiddlewareFn = async (request) => {
        const user_id =
            request.event.requestContext?.authorizer?.jwt.claims.sub;
        const spaceId = request.event.pathParameters?.space_id;

        const isMember = await checkUserSpaceMembership(user_id, spaceId);

        if (!isMember) {
            throw new createHttpError.Forbidden('Access Denied');
        }
    };

    return {
        before,
    };
};
