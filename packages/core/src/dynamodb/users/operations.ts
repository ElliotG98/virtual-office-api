import {
    PutCommand,
    DynamoDBDocumentClient,
    GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { dynamoDbClient } from '../client';
import { User } from '../../types/user';
import { HttpError } from '../../utils/response';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const addUser = async (user: User) => {
    const command = new PutCommand({
        TableName: Table.UserTable.tableName,
        Item: {
            user_id: user.id,
            name: user.name,
            email: user.email,
            title: user.title,
        },
    });

    const response = await docClient.send(command);
    console.log(response);
    return response;
};

export const getUser = async (userId: string): Promise<User | null> => {
    const params = {
        TableName: Table.UserTable.tableName,
        Key: {
            user_id: userId,
        },
    };

    try {
        const command = new GetCommand(params);
        const response = await docClient.send(command);

        if (!response.Item)
            throw new HttpError(
                404,
                'User not found',
                `User with id:${userId} was not found in the UserTable`,
            );

        return response.Item as User;
    } catch (error) {
        console.error('An error occurred while fetching the user:', error);
        return null;
    }
};
