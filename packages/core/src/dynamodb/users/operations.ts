import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { dynamoDbClient } from '../client';
import { User } from '../../types/user';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const addUser = async (user: User) => {
    const command = new PutCommand({
        TableName: Table.UserTable.tableName,
        Item: {
            user_id: user.id,
            name: user.name,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
    return response;
};
