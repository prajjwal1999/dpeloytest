import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { API_CONSTANTS } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration for scalability
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Content Generator API')
    .setDescription('Highly scalable content generation backend system')
    .setVersion(API_CONSTANTS.VERSION)
    .addTag('content-generation')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(API_CONSTANTS.SWAGGER_PATH, app, document);

  // Global prefix for API versioning
  app.setGlobalPrefix(API_CONSTANTS.PREFIX);

  const port = configService.get<number>('PORT') || API_CONSTANTS.DEFAULT_PORT;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/${API_CONSTANTS.SWAGGER_PATH}`);
}

bootstrap();
