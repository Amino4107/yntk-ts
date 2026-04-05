import swaggerJSDoc from 'swagger-jsdoc';
import { join } from 'path';
import env from '../config/env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Express backend',
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Development server',
      },
    ],
  },
  // Use process.cwd() to reliably find the YAML files in both dev and prod
  apis: [join(process.cwd(), 'src/docs/*.yaml')],
};

export const swaggerSpec = swaggerJSDoc(options);
