import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import corsOptions from './config/cors.config';
import routes from './routes/index';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import env from './config/env';

const app: Express = express();

app.use(cors(corsOptions));
app.use(express.json());

// Swagger Documentation
const isDev = env.nodeEnv === 'development';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: isDev ? {} : { supportedSubmitMethods: [] } // only show try it out button in development
}));

app.use(routes);

export default app;
