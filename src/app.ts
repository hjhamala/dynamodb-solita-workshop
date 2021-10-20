import * as express from 'express';
import * as bodyParser from 'body-parser';
import { NextFunction, RequestHandler, Request, Response } from 'express';
import {
  addMessage,
  addTopic,
  addUser,
  getTopicsByUser,
  searchUser,
} from './db';

const wrapAsyncHandlerError = (handler: RequestHandler) => (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return Promise.resolve(handler(req, res, next)).catch((error) => {
    console.error('Error in API call', {
      path: req.path,
      error,
      method: req.method,
      params: req.params,
      query: req.query,
    });

    res.set('Content-Type', 'application/json');
    res.status(500).send({});
  });
};

export const app = express();
app.use(express.json());
app.use(bodyParser.json());

app.get(
  '/health',
  wrapAsyncHandlerError(async (req: Request, res) => {
    res.send({ message: 'ok' });
  })
);

app.post(
  '/user',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const { name, email } = req.body;
    const id = await addUser(name, email);

    res.send({ name, email, id });
  })
);

app.get(
  '/user/:userId/topic',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const userId = req.params.userId;
    const topics = await getTopicsByUser(userId);

    res.send({ topics });
  })
);

app.get(
  '/user/search/:email',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const searchToken = req.params.email;

    const searchResult = await searchUser(searchToken);

    if (typeof searchResult === 'undefined') {
      return res.status(404).send();
    }

    res.send(searchResult);
  })
);

app.post(
  '/topic',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const { userId, topicName } = req.body;
    const topicId = await addTopic(userId, topicName);

    res.send({ topicId });
  })
);

app.post(
  '/topic/:topicId/message',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const topicId = req.params.topicId;
    const { message, userId } = req.body;
    const messageId = await addMessage(topicId, userId, message);

    res.send({ messageId });
  })
);
