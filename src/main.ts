import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  VersioningType,
  Logger,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

const API_VERSION = '1';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('HTTP');

  const NODE_ENV = configService.get<string>('NODE_ENV', 'development');
  const FRONTEND_URL = configService.get<string>('FRONTEND_URL');
  const PORT = configService.get<number>('PORT', 3000);

  app.use(helmet());

  app.enableCors({
    origin: NODE_ENV === 'development' ? true : [FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: API_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
      // excludeExtraneousValues: true,
    }),
    new HttpLoggingInterceptor(),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(cookieParser());

  // Присваиваем requestId каждому запросу, если отсутствует
  app.use(
    (req: Request & { id?: string }, res: Response, next: NextFunction) => {
      if (!req.id) {
        req.id = randomUUID();
      }
      res.setHeader('x-request-id', req.id);
      next();
    },
  );

  // Разрешаем только application/json для запросов с телом
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next();
    }
    if (req.is('application/json')) {
      return next();
    }
    res.status(415).json({
      statusCode: 415,
      message: 'Unsupported Media Type: Content-Type must be application/json',
      error: 'Unsupported Media Type',
    });
  });

  // Убрано: логирование перенесено в HttpLoggingInterceptor

  const config = new DocumentBuilder()
    .setTitle('Simple Knowledge Base API')
    .setDescription(
      'API for managing users and contents in a Simple Knowledge Base application.',
    )
    .setVersion(API_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  try {
    await app.listen(PORT);
    logger.log(`Application is running on: http://localhost:${PORT}`);
    logger.log(`Swagger documentation: http://localhost:${PORT}/docs`);
  } catch (error) {
    logger.error('Failed to start application', (error as Error).message);
    process.exit(1);
  }
}

void bootstrap();
