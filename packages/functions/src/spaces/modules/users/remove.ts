import { ApiHandler } from 'sst/node/api';
import removeEventSchema from './schemas/remove.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import {
    addUserToSpace,
    removeUserFromSpace,
} from '@virtual-office-api/core/dynamodb';
import { APIGatewayProxyEventWithAuthorizer } from '@virtual-office-api/core/types';
import { HttpError } from '@virtual-office-api/core/utils/response';

export const baseHandler = ApiHandler(
    async (_evt: APIGatewayProxyEventWithAuthorizer) => {
        try {
            const { space_id, user_id } = _evt.pathParameters as any;
            console.log('space_id', space_id);
            console.log('user_id', user_id);

            const initiated_by =
                _evt.requestContext?.authorizer?.jwt.claims.sub;
            console.log('initiated_by', initiated_by);

            if (!user_id) throw new HttpError(404, 'User not found');

            await removeUserFromSpace(
                user_id,
                space_id,
                initiated_by as string,
            );

            return response(200, { message: 'success' });
        } catch (e) {
            console.error('Error:', e);
            throw e;
        }
    },
);

export const handler = middyWrapper(
    baseHandler,
    removeEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
