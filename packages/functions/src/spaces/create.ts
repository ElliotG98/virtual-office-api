import { ApiHandler } from 'sst/node/api';
import createEventSchema from './schemas/create.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { addUserToSpace, createSpace } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { name } = _evt.body as any;
            console.log('name', name);

            const user_id = _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('user_id', user_id);

            if (!user_id) throw new HttpError(400, 'User not found');

            const space_id = await createSpace(name);
            console.log('space_id', space_id);

            await addUserToSpace(user_id, space_id, 'approved');

            return response(200, { space_id });
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
