import * as express from 'express';
import {NextFunction, RequestHandler, Request, Response} from 'express';

const wrapAsyncHandlerError = (handler: RequestHandler) => (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  return Promise.resolve(handler(req, res, next)).catch(error => {
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

export const app = express();
app.use(express.json());

app.get(
    '/health',
    wrapAsyncHandlerError(async (req: Request, res) => {
      res.send({message: 'ok'})
    })
)


