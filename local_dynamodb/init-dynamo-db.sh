#!/usr/bin/env bash
echo "Initializing testDb"
docker stop dynamodb
docker rm dynamodb
docker run -d --name dynamodb -p 8000:8000 amazon/dynamodb-local:latest  -jar DynamoDBLocal.jar -sharedDb -inMemory
aws dynamodb create-table --endpoint-url http://localhost:8000 --cli-input-json file://test-table.json
