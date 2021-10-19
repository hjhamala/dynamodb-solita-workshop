import { app } from './app';
const PORT = 3000;

const server = app.listen(PORT, async () => {
    console.info(`Backend running in port ${PORT}`);
});

