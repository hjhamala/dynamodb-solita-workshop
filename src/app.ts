import * as express from 'express'
import * as bodyParser from 'body-parser'
import { NextFunction, RequestHandler, Request, Response } from 'express'
import {
  addMessage,
  addTopic,
  addUser,
  getTopicsByUser,
  getUser,
  searchUser,
  updateName,
} from './db'

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
    })

    res.set('Content-Type', 'application/json')
    res.status(500).send({})
  })
}

export const app = express()
app.use(express.json())
app.use(bodyParser.json())

app.get(
  '/health',
  wrapAsyncHandlerError(async (req: Request, res) => {
    res.send({ message: 'ok' })
  })
)

app.post(
  '/user',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const { name, email } = req.body

    if (!name || !email) {
      return res.send(400)
    }
    const id = await addUser(name, email)

    res.send({ name, email, id })
  })
)

app.post(
  '/user/:userId/name',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const userId = req.params.userId
    const { name } = req.body

    if (!name) {
      return res.send(400)
    }

    const user = await getUser(req.params.userId)

    if (typeof user === 'undefined') {
      return res.status(404).send()
    }

    const id = await updateName(userId, user.updateId, user.name, name)

    res.send({ name, id })
  })
)

app.get(
  '/user/:userId/topic',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const userId = req.params.userId
    const topics = await getTopicsByUser(userId)

    res.send({ topics })
  })
)

app.get(
  '/user/search/:email',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const searchToken = req.params.email

    if (!searchToken) {
      return res.send(400)
    }

    const searchResult = await searchUser(searchToken)

    if (typeof searchResult === 'undefined') {
      return res.status(404).send()
    }

    res.send(searchResult)
  })
)

app.post(
  '/topic',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const { userId, topicName } = req.body
    const topicId = await addTopic(userId, topicName)

    res.send({ topicId })
  })
)

app.post(
  '/topic/:topicId/message',
  wrapAsyncHandlerError(async (req: Request, res) => {
    const topicId = req.params.topicId
    const { message, userId } = req.body

    if (!message || !userId) {
      return res.send(400)
    }

    const messageId = await addMessage(topicId, userId, message)

    res.send({ messageId })
  })
)
