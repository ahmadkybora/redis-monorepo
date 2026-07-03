import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisModuleOptions, RedisConnectionConfig } from './redis.interfaces';
import { REDIS_CLIENT, REDIS_CLIENTS } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisIoAdapter } from './redis-io.adapter';

@Global()
@Module({})
export class RedisModule {
  static registerMultiple(connections: RedisConnectionConfig[]): DynamicModule {
    const providers: Provider[] = [];

    connections.forEach(({ name, options }) => {
      const clientProvider: Provider = {
        provide: `${REDIS_CLIENT}_${name}`,
        useFactory: () => {
          return new Redis({
            host: options.host,
            port: options.port,
            password: options.password,
            db: options.db || 0,
            retryStrategy: (times) => Math.min(times * 50, 2000),
          });
        },
      };
      providers.push(clientProvider);
    });

    providers.push({
      provide: REDIS_CLIENTS,
      useFactory: (...clients: Redis[]) => {
        const map = new Map<string, Redis>();
        connections.forEach(({ name }, index) => {
          map.set(name, clients[index]);
        });
        return map;
      },
      inject: connections.map(({ name }) => `${REDIS_CLIENT}_${name}`),
    });

    providers.push(RedisService);
    // اضافه کردن RedisIoAdapter به عنوان یک Provider
    providers.push({
      provide: RedisIoAdapter,
      useFactory: (app: any, redisService: RedisService) => {
        return new RedisIoAdapter(app, redisService);
      },
      inject: ['APP_REFERENCE', RedisService], // 'APP_REFERENCE' باید در جای دیگری تعریف شود
    });

    return {
      module: RedisModule,
      providers,
      exports: [RedisService, REDIS_CLIENTS, RedisIoAdapter],
    };
  }

  static register(name: string, options: RedisModuleOptions): DynamicModule {
    return this.registerMultiple([{ name, options }]);
  }
}