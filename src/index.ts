import { app } from './app';
const PORT = 8080;

const server = app.listen(PORT, async () => {
  console.info(`Backend running in port ${PORT}`);
});
