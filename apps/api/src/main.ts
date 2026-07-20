import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting Zayjar platform API bootstrap sequence...');
  
  // Create a Nest application context to initialize modules
  const app = await NestFactory.createApplicationContext(AppModule);
  
  logger.log('Nest application context successfully initialized.');
  await app.close();
}

bootstrap();
