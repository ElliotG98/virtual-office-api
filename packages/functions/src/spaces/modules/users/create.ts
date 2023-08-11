import { ApiHandler } from 'sst/node/api';
import createEventSchema from './schemas/create.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { addUserToSpace } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { space_id } = _evt.pathParameters as any;
            console.log('space_id', space_id);

            const user_id = _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('user_id', user_id);

            if (!user_id) throw new Error('User not found');

            await addUserToSpace(user_id, space_id);

            return response(200, { message: 'success' });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

export const handler = middyWrapper(
    baseHandler,
    createEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
