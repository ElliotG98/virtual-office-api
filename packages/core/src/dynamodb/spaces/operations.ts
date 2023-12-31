import { dynamoDbClient } from '../client';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { v4 as uuid } from 'uuid';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const getSpace = async (space_id: string) => {
    const command = new GetCommand({
        TableName: Table.SpaceTable.tableName,
        Key: {
            space_id: space_id,
        },
    });

    const response = await docClient.send(command);
    return response.Item;
};

export const createSpace = async (name: string) => {
    const spaceId = uuid();
    console.log('Creating space', spaceId);

    const command = new PutCommand({
        TableName: Table.SpaceTable.tableName,
        Item: {
            space_id: spaceId,
            name: name,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
    return spaceId;
};
