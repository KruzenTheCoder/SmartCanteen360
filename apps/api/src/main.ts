import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID'],
  });

  // Global prefix and versioning
  const globalPrefix = configService.get<string>('API_GLOBAL_PREFIX', 'api');
  app.setGlobalPrefix(globalPrefix);
  
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get<string>('API_VERSION', 'v1'),
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (only in development)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SmartCanteen 360 API')
      .setDescription('Enterprise Digital Canteen Management Platform')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Employees', 'Employee management')
      .addTag('Meals', 'Meal catalog and scheduling')
      .addTag('Bookings', 'Meal booking management')
      .addTag('Kitchen', 'Kitchen production and queue')
      .addTag('POS', 'Point of sale operations')
      .addTag('Inventory', 'Inventory management')
      .addTag('Wallet', 'Employee wallet management')
      .addTag('Loyalty', 'Loyalty program')
      .addTag('Analytics', 'Reporting and analytics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Start server
  const port = configService.get<number>('API_PORT', 4000);
  await app.listen(port);

  console.log(`🚀 SmartCanteen 360 API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap();
