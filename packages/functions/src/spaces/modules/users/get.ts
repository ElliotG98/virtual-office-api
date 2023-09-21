import { ApiHandler } from 'sst/node/api';
import getEventSchema from './schemas/get.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { getUsersBySpace } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { space_id } = _evt.pathParameters as any;
            console.log('space_id', space_id);
            const user_id = _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('user_id', user_id);

            if (!user_id) throw new HttpError(404, 'User not found');

            const users = await getUsersBySpace(space_id, user_id);

            return response(200, { users });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

const authorizeUserSpace = true;

export const handler = middyWrapper(
    baseHandler,
    getEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
    authorizeUserSpace,
);
