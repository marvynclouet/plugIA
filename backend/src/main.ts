import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins =
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000,http://localhost:3001';

  // Permettre les requêtes depuis les extensions Chrome (chrome-extension://)
  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (extensions Chrome, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());
      
      // Autoriser les extensions Chrome
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }
      
      // Autoriser les origines configurées
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(null, true); // Autoriser toutes les origines en développement
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();

