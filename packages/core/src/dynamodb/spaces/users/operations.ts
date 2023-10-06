import { dynamoDbClient } from '../../client';
import {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
    BatchGetCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import {
    Status,
    User,
    UserSpaceActionStatus,
    UserSpaceLogStatus,
} from '../../../types';
import { HttpError } from '../../../utils/response';
import { v4 as uuid } from 'uuid';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const logUserSpaceAction = async (
    action: UserSpaceActionStatus,
    userId: string,
    spaceId: string,
    status: UserSpaceLogStatus,
    initiated_by: string,
) => {
    const logId = uuid();
    const logCommand = new PutCommand({
        TableName: Table.UserSpaceLogTable.tableName,
        Item: {
            log_id: logId,
            user_id: userId,
            space_id: spaceId,
            action,
            status,
            initiated_by,
            timestamp: new Date().toISOString(),
        },
    });
    await docClient.send(logCommand);
    return logId;
};

const updateUserSpaceLogStatus = async (
    logId: string,
    status: string,
    errorMessage?: string,
) => {
    const updateLogCommand = new PutCommand({
        TableName: Table.UserSpaceLogTable.tableName,
        Item: {
            log_id: logId,
            status,
            timestamp: new Date().toISOString(),
            error_message: errorMessage,
        },
    });
    await docClient.send(updateLogCommand);
};

export const addUserToSpace = async (
    userId: string,
    spaceId: string,
    status: Status,
) => {
    const queryCommand = new QueryCommand({
        TableName: Table.UserSpaceTable.tableName,
        KeyConditionExpression: 'user_id = :userId AND space_id = :spaceId',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':spaceId': spaceId,
        },
    });

    const result = await docClient.send(queryCommand);

    if (result.Items && result.Items.length > 0) {
        const userSpaceTableEntry = result.Items[0];

        if (
            userSpaceTableEntry.status === 'requested' &&
            status === 'requested'
        ) {
            throw new HttpError(400, 'A request has already been made');
        } else if (userSpaceTableEntry.status === 'approved') {
            throw new HttpError(400, 'Already active in that space');
        }
    }

    const command = new PutCommand({
        TableName: Table.UserSpaceTable.tableName,
        Item: {
            user_id: userId,
            space_id: spaceId,
            status: status,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
    return response;
};

export const getUsersBySpace = async (
    spaceId: string,
    currentUserId: string,
) => {
    const command = new QueryCommand({
        TableName: Table.UserSpaceTable.tableName,
        IndexName: 'bySpace',
        KeyConditionExpression: '#spaceId = :spaceIdVal',
        ExpressionAttributeNames: {
            '#spaceId': 'space_id',
        },
        ExpressionAttributeValues: {
            ':spaceIdVal': spaceId,
        },
    });

    const response = await docClient.send(command);
    const userSpaceItems = response.Items?.map((item) => ({
        user_id: item.user_id,
        status: item.status,
    }));
    if (!userSpaceItems || userSpaceItems.length === 0) return [];

    const keys = userSpaceItems.map((userSpaceItem) => ({
        user_id: userSpaceItem.user_id,
    }));

    const userCommand = new BatchGetCommand({
        RequestItems: {
            [Table.UserTable.tableName]: {
                Keys: keys,
            },
        },
    });

    const userResponse = await docClient.send(userCommand);
    const users = userResponse.Responses?.[Table.UserTable.tableName] || [];

    return users.map((user) => ({
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        title: user.title,
        currentUser: user.user_id === currentUserId,
        status: userSpaceItems.find(
            (userSpaceItem) => userSpaceItem.user_id === user.user_id,
        )?.status,
    })) as User[];
};

export const removeUserFromSpace = async (
    userId: string,
    spaceId: string,
    initiated_by: string,
) => {
    const logId = await logUserSpaceAction(
        'REMOVE',
        userId,
        spaceId,
        'PENDING',
        initiated_by,
    );

    try {
        const transactWriteCommand = new TransactWriteCommand({
            TransactItems: [
                {
                    Delete: {
                        TableName: Table.UserSpaceTable.tableName,
                        Key: {
                            user_id: userId,
                            space_id: spaceId,
                        },
                    },
                },
                {
                    Update: {
                        TableName: Table.UserSpaceLogTable.tableName,
                        Key: {
                            log_id: logId,
                        },
                        UpdateExpression: 'set #status = :status',
                        ExpressionAttributeNames: {
                            '#status': 'status',
                        },
                        ExpressionAttributeValues: {
                            ':status': 'SUCCESS',
                        },
                    },
                },
            ],
        });

        await docClient.send(transactWriteCommand);
        return { status: 'User removed successfully' };
    } catch (error: any) {
        await updateUserSpaceLogStatus(logId, 'FAILED', error.message);
        throw new HttpError(500, 'Failed to remove user');
    }
};
