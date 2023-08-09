import middy from '@middy/core';
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

// Custom middleware function to conditionally parse JSON body
export const conditionalJsonBodyParser = (): middy.MiddlewareObj<
  APIGatewayProxyEventV2,
  APIGatewayProxyResult
> => {
  const before: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyResult
  > = async (request): Promise<void> => {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        request.event?.requestContext?.http?.method
      )
    ) {
      try {
        if (request.event.body) {
          request.event.body = JSON.parse(request.event.body);
          console.log(request.event.body);
        }
      } catch (error) {
        // Ignore parse errors and let the request continue with the original body
      }
    }
  };

  return {
    before,
  };
};
