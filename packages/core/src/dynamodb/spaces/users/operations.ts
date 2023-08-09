import { dynamoDbClient } from '../../client';
import {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const addUserToSpace = async (userId: string, spaceId: string) => {
    const command = new PutCommand({
        TableName: Table.UserSpaceTable.tableName,
        Item: {
            user_id: userId,
            space_id: spaceId,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
    return response;
};

export const getUsersBySpace = async (spaceId: string) => {
    const command = new QueryCommand({
        TableName: Table.UserSpaceTable.tableName,
        KeyConditionExpression: '#spaceId = :spaceIdVal',
        ExpressionAttributeNames: {
            '#spaceId': 'space_id',
        },
        ExpressionAttributeValues: {
            ':spaceIdVal': spaceId,
        },
    });

    const response = await docClient.send(command);
    return response.Items;
};
