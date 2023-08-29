import { ApiHandler } from 'sst/node/api';
import updateEventSchema from './schemas/update.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { updateUser } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { firstName, lastName, email, title } = _evt.body as any;
            console.log('body', _evt.body);

            const user_id = _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('user_id', user_id);

            if (!user_id) throw new HttpError(400, 'User not found');

            await updateUser({
                id: user_id,
                firstName,
                lastName,
                email,
                title,
            });

            return response(200, { message: 'success' });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

export const handler = middyWrapper(
    baseHandler,
    updateEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
