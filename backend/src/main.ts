import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Increase payload limits for image uploads (up to 50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global exception filter for Prisma database errors
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Robust CORS Configuration for development and production
  const allowedOriginPatterns = [
    /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/, // Localhost on any port (3000, 3001, etc.)
    /^http:\/\/192\.168\.\d+\.\d+(:[0-9]+)?$/,      // Local network devices (tablets, mobile, showroom PCs)
    /^http:\/\/10\.\d+\.\d+\.\d+(:[0-9]+)?$/,        // Private network
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check environment variable FRONTEND_URL if set
      const configuredFrontend = process.env.FRONTEND_URL;
      if (configuredFrontend && origin === configuredFrontend) {
        return callback(null, true);
      }

      // Check against allowed origin patterns
      const isAllowed = allowedOriginPatterns.some((pattern) =>
        pattern.test(origin),
      );

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-access-token',
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix for all REST endpoints
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 CSM Backend running on: http://localhost:${port}/api`);
}

bootstrap();
