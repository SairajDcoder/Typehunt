import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TypeHunt API',
      version: '1.0.0',
      description: 'Real-time multiplayer typing game API',
      contact: {
        name: 'TypeHunt Team',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        GameResult: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            mode: { type: 'string', enum: ['SINGLE', 'HARDCORE'] },
            wpm: { type: 'number' },
            accuracy: { type: 'number' },
            timeTaken: { type: 'number' },
            wordCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Lobby: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', maxLength: 6 },
            hostId: { type: 'string' },
            settings: { type: 'object' },
            status: { type: 'string', enum: ['WAITING', 'IN_GAME', 'FINISHED', 'CLOSED'] },
            playerLimit: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
