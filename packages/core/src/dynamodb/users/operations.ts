import {
    PutCommand,
    DynamoDBDocumentClient,
    GetCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';
import { dynamoDbClient } from '../client';
import { User } from '../../types/user';
import { HttpError } from '../../utils/response';
import { QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { generateUpdateExpression } from '../../utils/dynamodb/helpers';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const addUser = async (user: User) => {
    try {
        const putCommand = new PutCommand({
            TableName: Table.UserTable.tableName,
            ConditionExpression: 'attribute_not_exists(email)',
            Item: {
                user_id: user.id,
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email,
                title: user.title,
            },
        });

        await docClient.send(putCommand);
    } catch (error: any) {
        if (error?.name === 'ConditionalCheckFailedException') {
            throw new HttpError(400, 'Email already exists');
        }
        throw new HttpError(500, 'Internal Server Error');
    }
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
        console.error(
            'An error occurred while fetching the user:',
            JSON.stringify(error),
        );
        throw error;
    }
};

export const getUserByEmail = async (email: string) => {
    try {
        const queryCommand = new QueryCommand({
            TableName: Table.UserTable.tableName,
            IndexName: 'emailIndex',
            KeyConditionExpression: 'email = :value',
            ExpressionAttributeValues: {
                ':value': { S: email },
            },
        });
        const response = await docClient.send(queryCommand);

        const users = response.Items || [];

        if (!users.length) {
            throw new HttpError(
                404,
                'A user with that email was not found',
                `User with email:${email} was not found in the UserTable`,
            );
        }

        const user = users[0];

        return {
            id: user.user_id.S,
            firstName: user?.first_name.S,
            lastName: user?.last_name.S,
            email: user?.email.S,
            title: user?.title.S,
        } as User;
    } catch (error) {
        console.error(
            'An error occurred while fetching the user:',
            JSON.stringify(error),
        );
        throw error;
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
