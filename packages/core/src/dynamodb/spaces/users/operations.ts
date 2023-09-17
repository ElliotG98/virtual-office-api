import { dynamoDbClient } from '../../client';
import {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
    BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { Status } from '../../../types';
import { HttpError } from '../../../utils/response';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

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

        if (userSpaceTableEntry.status === 'requested') {
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
    const userIds = response.Items?.map((item) => item.user_id);
    if (!userIds || userIds.length === 0) return [];

    const keys = userIds.map((userId) => ({ user_id: userId }));

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
        ...user,
        currentUser: user.user_id === currentUserId,
    }));
};
