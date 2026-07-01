import { Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';
import { RabbitMQModule } from '@app/rabbitmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    RedisModule.registerMultiple([
      {
        name: 'default',
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          db: 0,
        },
      },
      {
        name: 'cache',
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          db: 1,
        },
      },
    ]),
    RabbitMQModule.register({
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: parseInt(process.env.RABBITMQ_PORT) || 5672,
      username: process.env.RABBITMQ_USER || 'admin',
      password: process.env.RABBITMQ_PASS || 'admin123',
      queueName: 'gateway_queue',
      exchangeName: 'user_exchange',
      routingKey: 'user.*',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}