import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' });

  await app.listen(Number(process.env.PORT) || 3001);
}

bootstrap();
