import { ApiHandler } from 'sst/node/api';
import createEventSchema from './schemas/create.schema.event.json';
import { middyWrapper } from '@virtual-office-api/core/utils/middleware';
import {
    response,
    genericSchemaResponse,
} from '@virtual-office-api/core/utils';
import { JSONSchema7 } from 'json-schema';

export const baseHandler = ApiHandler(async (_evt) => {
    try {
        return response(200, { message: 'success' });
    } catch (e) {
        console.error('Error:', e);
        throw e;
    }
});

export const handler = middyWrapper(
    baseHandler,
    createEventSchema as JSONSchema7,
    genericSchemaResponse as JSONSchema7,
);
