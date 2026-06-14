import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:9701',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(9702);
  console.log('Backend is running on http://localhost:9702');
}
bootstrap();
