import { config, DynamoDB } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const tableName = 'Test';

config.update({ region: 'eu-west-1' });

export const dynamo = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: 'http://localhost:8000',
});

export async function addUser(name: string, email: string): Promise<string> {
  const userId = uuid();
  const userItem = { pk: userId, sk: 'user', name, email };
  const searchItem = { pk: 'email', sk: email, userId };

  await dynamo
    .transactWrite({
      TransactItems: [
        { Put: { TableName: tableName, Item: userItem } },
        {
          Put: {
            TableName: tableName,
            Item: searchItem,
            ConditionExpression: 'attribute_not_exists(pk)',
          },
        },
      ],
    })
    .promise();
  return userId;
}

export async function searchUser(
  emailToken: string
): Promise<{ name: string; email: string; id: string } | undefined> {
  const params = {
    TableName: tableName,
    Key: { pk: 'email', sk: emailToken },
  };

  const result = await dynamo.get(params).promise();

  if (typeof result.Item === 'undefined') {
    return undefined;
  }

  const userParams = {
    TableName: tableName,
    Key: { pk: result.Item.userId, sk: 'user' },
  };
  const user = await dynamo.get(userParams).promise();

  const { email, name, id } = user.Item;

  return { email, name, id };
}
