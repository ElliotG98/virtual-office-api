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

type LambdaHandler = (
    event: APIGatewayProxyEventV2,
    context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>;

export const middyWrapper = (
    baseHandler: LambdaHandler,
    eventSchemaJson: JSONSchema7,
    responseSchemaJson: JSONSchema7,
) => {
    const eventSchema = transpileSchema(eventSchemaJson);
    const responseSchema = transpileSchema(responseSchemaJson);

    return middy(baseHandler)
        .use(conditionalJsonBodyParser())
        .use(validator({ eventSchema, responseSchema }))
        .use({
            onError: (request) => {
                const response = request.response;
                const error = <any>request.error;
                if (response.statusCode != 400) return;
                if (!error.expose || !error.cause) return;
                response.headers['Content-Type'] = 'application/json';
                response.body = JSON.stringify({
                    message: response.body,
                    validationErrors: error.cause,
                });
            },
        })
        .use(httpErrorHandler());
};
