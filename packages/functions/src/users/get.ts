import { ApiHandler } from 'sst/node/api';
import getEventSchema from './schemas/get.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { getUser } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const user_id = _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('user_id', user_id);

            if (!user_id) throw new HttpError(400, 'User not found');

            const user = await getUser(user_id);

            return response(200, { message: 'success', user });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

export const handler = middyWrapper(
    baseHandler,
    getEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
