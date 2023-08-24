import { dynamoDbClient } from '../../client';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Table } from 'sst/node/table';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const getSpacesByUser = async (user_id: string) => {
    const userSpaceCommand = new QueryCommand({
        TableName: Table.UserSpaceTable.tableName,
        KeyConditionExpression: 'user_id = :user_id',
        ExpressionAttributeValues: {
            ':user_id': user_id,
        },
    });
    const userSpaceResponse = await docClient.send(userSpaceCommand);

    const spaceIds =
        userSpaceResponse.Items?.map((item) => item.space_id) || [];

    const spacesDetails = await Promise.all(
        spaceIds.map(async (space_id) => {
            const spaceCommand = new QueryCommand({
                TableName: Table.SpaceTable.tableName,
                KeyConditionExpression: 'space_id = :space_id',
                ExpressionAttributeValues: {
                    ':space_id': space_id,
                },
            });
            const spaceResponse = await docClient.send(spaceCommand);
            return spaceResponse.Items?.[0];
        }),
    );

    return spacesDetails;
};

export const checkUserSpaceMembership = async (
    userId: string,
    spaceId: string,
) => {
    const command = new QueryCommand({
        TableName: Table.UserSpaceTable.tableName,
        IndexName: 'byUserAndSpace',
        KeyConditionExpression:
            '#userId = :userIdVal AND #spaceId = :spaceIdVal',
        ExpressionAttributeNames: {
            '#userId': 'user_id',
            '#spaceId': 'space_id',
        },
        ExpressionAttributeValues: {
            ':userIdVal': userId,
            ':spaceIdVal': spaceId,
        },
    });

    const response = await docClient.send(command);

    if (!response.Items) return false;

    const approvedUsers = response.Items?.filter(
        (item) => item.status === 'approved',
    );

    return approvedUsers?.length > 0 || false;
};
