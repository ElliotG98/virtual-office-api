import { Api, Table, StackContext, Cognito, Config } from 'sst/constructs';

const baseLambdaPath = 'packages/functions/src/';

export function VirtualOfficeStack({ stack }: StackContext) {
    const userTable = new Table(stack, 'UserTable', {
        fields: {
            user_id: 'string',
            first_name: 'string',
            last_name: 'string',
            email: 'string',
            title: 'string',
        },
        primaryIndex: { partitionKey: 'user_id' },
        globalIndexes: {
            emailIndex: { partitionKey: 'email' },
        },
    });

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
            status: 'string',
        },
        primaryIndex: { partitionKey: 'user_id', sortKey: 'space_id' },
        globalIndexes: {
            bySpace: { partitionKey: 'space_id', sortKey: 'user_id' },
            byUserAndSpace: { partitionKey: 'user_id', sortKey: 'space_id' },
        },
    });

    const userSpaceLogTable = new Table(stack, 'UserSpaceLogTable', {
        fields: {
            log_id: 'string',
            user_id: 'string',
            space_id: 'string',
            action: 'string',
            status: 'string',
            initiated_by: 'string',
            error_message: 'string',
            timestamp: 'string',
        },
        primaryIndex: { partitionKey: 'log_id' },
        globalIndexes: {
            byUser: { partitionKey: 'user_id', sortKey: 'timestamp' },
            bySpace: { partitionKey: 'space_id', sortKey: 'timestamp' },
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

    const auth = new Cognito(stack, 'Auth', {
        login: ['email'],
    });

    const USER_POOL_ID = new Config.Parameter(stack, 'USER_POOL_ID', {
        value: auth.userPoolId,
    });

    const USER_POOL_CLIENT_ID = new Config.Parameter(
        stack,
        'USER_POOL_CLIENT_ID',
        {
            value: auth.userPoolClientId,
        },
    );

    const api = new Api(stack, 'Api', {
        defaults: {
            function: {
                bind: [
                    spaceTable,
                    userSpaceTable,
                    userSpaceLogTable,
                    messagesTable,
                    userTable,
                    USER_POOL_ID,
                    USER_POOL_CLIENT_ID,
                ],
            },
            authorizer: 'jwt',
        },
        authorizers: {
            jwt: {
                type: 'user_pool',
                userPool: {
                    id: auth.userPoolId,
                    clientIds: [auth.userPoolClientId],
                },
            },
        },
        routes: {
            'POST /spaces': baseLambdaPath + 'spaces/create.handler',
            'GET /spaces/{space_id}': baseLambdaPath + 'spaces/get.handler',
            'GET /spaces/{space_id}/users':
                baseLambdaPath + 'spaces/modules/users/get.handler',
            'POST /users': baseLambdaPath + 'users/create.handler',
            'GET /users': baseLambdaPath + 'users/get.handler',
            'PATCH /users': baseLambdaPath + 'users/update.handler',
            'GET /users/spaces':
                baseLambdaPath + 'users/modules/spaces/get.handler',
            'POST /spaces/{space_id}/users/request':
                baseLambdaPath + 'spaces/modules/users/request.handler',
            'POST /spaces/{space_id}/users/{user_id}/approve':
                baseLambdaPath + 'spaces/modules/users/approve.handler',
            'POST /spaces/{space_id}/users/{user_id}/reject':
                baseLambdaPath + 'spaces/modules/users/reject.handler',
            'POST /spaces/{space_id}/users/invite':
                baseLambdaPath + 'spaces/modules/users/invite.handler',
            'DELETE /spaces/{space_id}/users/{user_id}':
                baseLambdaPath + 'spaces/modules/users/remove.handler',
        },
    });

    auth.attachPermissionsForAuthUsers(stack, [api]);

    stack.addOutputs({
        ApiEndpoint: api.url,
        UserPoolId: auth.userPoolId,
        UserPoolClientId: auth.userPoolClientId,
        IdentityPoolId: auth.cognitoIdentityPoolId,
        spaceTableArn: spaceTable.tableArn,
        userSpaceTableArn: userSpaceTable.tableArn,
        userSpaceLogTableArn: userSpaceLogTable.tableArn,
        messagesTableArn: messagesTable.tableArn,
        userTableArn: userTable.tableArn,
    });
}
