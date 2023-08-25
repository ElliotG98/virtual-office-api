import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    Context,
} from 'aws-lambda';
import middy from '@middy/core';
import validator from '@middy/validator';
import httpErrorHandler from '@middy/http-error-handler';
import { transpileSchema } from '@middy/validator/transpile';
import { JSONSchema7 } from 'json-schema';
import { conditionalJsonBodyParser } from './conditionalJSONBodyParser.js';
import { authorizeUserSpaceMembership } from './authorizeUserSpace.js';
import { customErrorHandler } from './customErrorHandler.js';

type LambdaHandler = (
    event: APIGatewayProxyEventV2,
    context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>;

export const middyWrapper = (
    baseHandler: LambdaHandler,
    eventSchemaJson: JSONSchema7,
    responseSchemaJson: JSONSchema7,
    authorizeUserSpace?: boolean,
) => {
    const eventSchema = transpileSchema(eventSchemaJson);
    const responseSchema = transpileSchema(responseSchemaJson);

    let handler = middy(baseHandler)
        .use(conditionalJsonBodyParser())
        .use(validator({ eventSchema, responseSchema }))
        .use(customErrorHandler())
        .use(httpErrorHandler());

    if (authorizeUserSpace) {
        handler = handler.use(authorizeUserSpaceMembership());
    }

    return handler;
};
