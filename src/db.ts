import { config, DynamoDB } from 'aws-sdk'
import { v4 as uuid } from 'uuid'

const tableName = 'Test'

config.update({ region: 'eu-west-1' })

export const dynamo = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: 'http://localhost:8000',
})

export async function addUser(name: string, email: string): Promise<string> {
  const userId = uuid()
  const updateId = uuid()
  const userItem = { pk: userId, sk: 'user', name, email, updateId }
  const searchItem = { pk: 'email', sk: email, userId }

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
    .promise()
  return userId
}

export async function getUser(
  userId: string
): Promise<
  { name: string; email: string; id: string; updateId: string } | undefined
> {
  const userParams = {
    TableName: tableName,
    Key: { pk: userId, sk: 'user' },
  }
  const user = await dynamo.get(userParams).promise()

  if (typeof user.Item === 'undefined') {
    return undefined
  }

  const { email, name, id, updateId } = user.Item

  return { email, name, id, updateId }
}

export async function searchUser(
  emailToken: string
): Promise<{ name: string; email: string; id: string } | undefined> {
  const params = {
    TableName: tableName,
    Key: { pk: 'email', sk: emailToken },
  }

  const result = await dynamo.get(params).promise()

  if (typeof result.Item === 'undefined') {
    return undefined
  }

  return await getUser(result.Item.userId)
}

export async function addTopic(
  userId: string,
  topicName: string
): Promise<string> {
  const topicId = uuid()
  const topicItem = {
    pk: topicId,
    sk: 'topic',
    name: topicName,
  }
  const userTopicSearch = {
    pk: userId,
    sk: `topic#${topicId}`,
    name: topicName,
  }

  await dynamo
    .transactWrite({
      TransactItems: [
        {
          ConditionCheck: {
            TableName: tableName,
            ConditionExpression: 'attribute_exists(pk)',
            Key: { pk: userId, sk: 'user' },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: topicItem,
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: userTopicSearch,
          },
        },
      ],
    })
    .promise()
  return userId
}

export async function getTopicsByUser(
  userId: string
): Promise<Array<{ topicName: string; topicId: string }>> {
  const topics = await dynamo
    .query({
      TableName: tableName,
      KeyConditionExpression: 'pk = :userId AND begins_with(sk, :topic)',
      ExpressionAttributeValues: { ':userId': userId, ':topic': 'topic#' },
    })
    .promise()
  return topics.Items.map((i) => ({
    topicName: i.name,
    topicId: i.sk.split('#')[1],
  }))
}

export async function addMessage(
  topicId: string,
  userId: string,
  message: string
): Promise<string> {
  const messageId = uuid()
  const messageItem = {
    pk: topicId,
    sk: `topic#message#${messageId}`,
    userId,
    message,
  }

  const userMessage = {
    pk: userId,
    sk: `message#${messageId}`,
    topicId,
    message,
  }

  const time = new Date().toISOString()

  await dynamo
    .transactWrite({
      TransactItems: [
        {
          Update: {
            TableName: tableName,
            ConditionExpression: 'attribute_exists(pk)',
            UpdateExpression: 'SET lastUpdate = :lastupdate',
            ExpressionAttributeValues: { ':lastupdate': time },
            Key: { pk: topicId, sk: 'topic' },
          },
        },
        {
          ConditionCheck: {
            TableName: tableName,
            ConditionExpression: 'attribute_exists(pk)',
            Key: { pk: userId, sk: 'user' },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: messageItem,
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: userMessage,
          },
        },
      ],
    })
    .promise()
  return userId
}

export async function updateName(
  userId: string,
  previousUpdateId: string,
  previousName: string,
  newName: string
): Promise<string> {
  const newUpdateId = uuid()

  await dynamo
    .transactWrite({
      TransactItems: [
        {
          Update: {
            TableName: tableName,
            ConditionExpression:
              'attribute_exists(pk) AND updateId = :previousId',
            UpdateExpression: 'SET updateId = :newupdateId, #name = :newName',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
              ':previousId': previousUpdateId,
              ':newupdateId': newUpdateId,
              ':newName': newName,
            },
            Key: { pk: userId, sk: 'user' },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: {
              pk: userId,
              sk: `user#history#${newUpdateId}`,
              previousName,
              newName,
            },
          },
        },
      ],
    })
    .promise()
  return userId
}
