import { ApiHandler } from 'sst/node/api';
import inviteEventSchema from './schemas/invite.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import {
    addUserToSpace,
    getUserByEmail,
} from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { space_id } = _evt.pathParameters as any;
            console.log('space_id', space_id);

            const { email } = _evt.body as any;
            console.log('email', email);

            const user = await getUserByEmail(email);

            await addUserToSpace(user.id, space_id, 'approved');

            return response(200, { message: 'success' });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

const authorizeUserSpace = true;

export const handler = middyWrapper(
    baseHandler,
    inviteEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
    authorizeUserSpace,
);
