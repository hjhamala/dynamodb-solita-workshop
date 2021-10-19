import {config, DynamoDB} from 'aws-sdk';
import {v4 as uuid} from 'uuid';

const tableName = 'Test'

config.update({region: 'eu-west-1'});

export const dynamo = new DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    endpoint: 'http://localhost:8000',
});

export async function addUser(name: string, email: string): Promise<string> {
    const userId = uuid()
    await dynamo.put({TableName: tableName, Item: {pk: 'user', sk: userId, name, email}}).promise()
    return userId
}

export async function searchUser(emailToken: string): Promise<{ name: string, email: string, id: string } | undefined> {
    const params = {
        TableName: tableName,
        FilterExpression: '#email = :emailToken',
        ExpressionAttributeNames: {"#email": 'email'},
        ExpressionAttributeValues: {":emailToken": emailToken}
    }

    const result = await dynamo.scan(params).promise()

    if (result.Items.length === 0) {
        return undefined
    }

    const {email, name, id} = result.Items[0]

    return {email, name, id}
}
