import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from '@app/redis';
import { RedisService } from '@app/redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisService = app.get(RedisService);
  const redisIoAdapter = new RedisIoAdapter(app, redisService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  await app.listen(3000);
}
bootstrap();