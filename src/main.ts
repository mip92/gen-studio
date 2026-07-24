import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env'), override: true });

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors();
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Gen Studio API')
    .setDescription('AI video production management — multi-project SaaS')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Long-running exports (the cinematic-comic build renders hi-res sheets and can
  // run for 10+ minutes) must not be cut by Node's default 5-min requestTimeout.
  // Disable per-request/header/socket timeouts on the HTTP server.
  const server = app.getHttpServer() as import('http').Server;
  server.requestTimeout = 0;      // no cap on how long a single request may take
  server.headersTimeout = 0;      // don't abort while the handler runs silently
  server.setTimeout(0);           // no socket inactivity timeout
  server.keepAliveTimeout = 65_000;

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Gen Studio API  http://localhost:${port}`);
  console.log(`Swagger UI      http://localhost:${port}/docs`);
}

bootstrap();
