import { ApiHandler } from 'sst/node/api';
import getEventSchema from './schemas/get.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';
import { getUsersBySpace } from '@virtual-office-api/core/dynamodb';

export const baseHandler = ApiHandler(async (_evt) => {
    try {
        const { space_id } = _evt.pathParameters as any;
        console.log('space_id', space_id);

        const users = await getUsersBySpace(space_id);

        return response(200, { users });
    } catch (e) {
        console.error('Error:', e);
        throw e;
    }
});

export const handler = middyWrapper(
    baseHandler,
    getEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
