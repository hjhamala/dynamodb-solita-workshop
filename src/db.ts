import { config, DynamoDB } from 'aws-sdk';

config.update({ region: 'eu-west-1' });

export const dynamo = new DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: 'http://localhost:8000',
});
