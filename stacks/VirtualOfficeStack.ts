import { Api, Table, StackContext, Cognito } from 'sst/constructs';

const baseLambdaPath = 'packages/functions/src/';

export function VirtualOfficeStack({ stack }: StackContext) {
    const spaceTable = new Table(stack, 'SpaceTable', {
        fields: {
            space_id: 'string',
            name: 'string',
        },
        primaryIndex: { partitionKey: 'space_id' },
    });

    const userSpaceTable = new Table(stack, 'UserSpaceTable', {
        fields: {
            user_id: 'string',
            space_id: 'string',
        },
        primaryIndex: { partitionKey: 'user_id', sortKey: 'space_id' },
        globalIndexes: {
            bySpace: { partitionKey: 'space_id', sortKey: 'user_id' },
        },
    });

    const messagesTable = new Table(stack, 'MessagesTable', {
        fields: {
            space_id: 'string',
            timestamp: 'string',
            sender_id: 'string',
            content: 'string',
            read_status: 'string',
        },
        primaryIndex: { partitionKey: 'space_id', sortKey: 'timestamp' },
    });

    const api = new Api(stack, 'Api', {
        defaults: {
            function: {
                bind: [spaceTable, userSpaceTable, messagesTable],
            },
            authorizer: 'iam',
        },
        routes: {
            'POST /spaces': baseLambdaPath + 'spaces/create.handler',
            'POST /spaces/{space_id}/users':
                baseLambdaPath + 'spaces/modules/users/update.handler',
            'GET /spaces/{space_id}/users':
                baseLambdaPath + 'spaces/modules/users/get.handler',
        },
    });

    const auth = new Cognito(stack, 'Auth', {
        login: ['email'],
    });

    auth.attachPermissionsForAuthUsers(stack, [api]);

    stack.addOutputs({
        ApiEndpoint: api.url,
        UserPoolId: auth.userPoolId,
        UserPoolClientId: auth.userPoolClientId,
        IdentityPoolId: auth.cognitoIdentityPoolId,
        spaceTableArn: spaceTable.tableArn,
        userSpaceTableArn: userSpaceTable.tableArn,
        messagesTableArn: messagesTable.tableArn,
    });
}
