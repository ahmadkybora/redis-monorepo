import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  
  const app = await NestFactory.create(AppModule);
  
  // ========== تنظیمات Global ==========
  
  // 1. اعتبارسنجی خودکار
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // فقط فیلدهای تعریف شده در DTO قبول می‌شوند
      forbidNonWhitelisted: true, // اگر فیلد اضافی بفرستند خطا می‌دهد
      transform: true,        // تبدیل خودکار به تایپ‌های تعریف شده
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 2. فعال کردن CORS
  app.enableCors({
    origin: '*', // در تولید بهتر است محدود کنید
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // 3. تنظیم Global Prefix (اختیاری)
  // app.setGlobalPrefix('api/v1');

  // 4. لیسن کردن روی پورت
  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 API Gateway is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`📊 Cache stats: http://localhost:${port}/cache/stats`);
  logger.log(`📊 RabbitMQ test: http://localhost:${port}/test/rabbitmq (POST)`);
  logger.log(`📊 Users API: http://localhost:${port}/users`);
}

bootstrap();