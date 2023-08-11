import { APIGatewayProxyEventV2 } from 'aws-lambda';

export type APIGatewayProxyEventWithAuthorizer = APIGatewayProxyEventV2 & {
    requestContext: {
        authorizer?: {
            jwt: {
                claims: {
                    sub: string;
                };
            };
        };
    };
};
