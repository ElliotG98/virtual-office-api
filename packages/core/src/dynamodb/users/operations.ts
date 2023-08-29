import {
    PutCommand,
    DynamoDBDocumentClient,
    GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { dynamoDbClient } from '../client';
import { User } from '../../types/user';
import { HttpError } from '../../utils/response';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { generateUpdateExpression } from '../../utils/dynamodb/helpers';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const addUser = async (user: User) => {
    const command = new PutCommand({
        TableName: Table.UserTable.tableName,
        Item: {
            user_id: user.id,
            first_name: user.firstName,
            last_name: user.lastName,
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

        if (!response.Item) {
            throw new HttpError(
                404,
                'User not found',
                `User with id:${userId} was not found in the UserTable`,
            );
        }

        return {
            ...response.Item,
            firstName: response.Item.first_name,
            lastName: response.Item.last_name,
        } as User;
    } catch (error) {
        console.error('An error occurred while fetching the user:', error);
        return null;
    }
};

export const updateUser = async (user: Partial<User>) => {
    const { id, email, ...rest } = user;
    const command = new UpdateItemCommand({
        TableName: Table.UserTable.tableName,
        Key: {
            user_id: user.id,
        },
        ...generateUpdateExpression(rest),
    });
    const response = await docClient.send(command);
    return response;
};
