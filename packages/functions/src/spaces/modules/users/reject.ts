import { ApiHandler } from 'sst/node/api';
import rejectEventSchema from './schemas/reject.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { addUserToSpace } from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { space_id, user_id } = _evt.pathParameters as any;
            console.log('space_id', space_id);

            if (!user_id) throw new HttpError(404, 'User not found');

            await addUserToSpace(user_id, space_id, 'rejected');

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
    rejectEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
    authorizeUserSpace,
);
