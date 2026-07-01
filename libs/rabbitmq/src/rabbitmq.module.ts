import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQModuleOptions } from './rabbitmq.interfaces';
import { RABBITMQ_OPTIONS } from './rabbitmq.constants';

@Module({})
export class RabbitMQModule {
  static register(options: RabbitMQModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: RABBITMQ_OPTIONS,
      useValue: options,
    };

    const serviceProvider: Provider = {
      provide: RabbitMQService,
      useFactory: (opts: RabbitMQModuleOptions) => {
        return new RabbitMQService(opts);
      },
      inject: [RABBITMQ_OPTIONS],
    };

    return {
      module: RabbitMQModule,
      providers: [optionsProvider, serviceProvider],
      exports: [RabbitMQService],
      global: true,
    };
  }

  static registerAsync(options: {
    useFactory: (...args: any[]) => Promise<RabbitMQModuleOptions> | RabbitMQModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const asyncOptionsProvider: Provider = {
      provide: RABBITMQ_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const serviceProvider: Provider = {
      provide: RabbitMQService,
      useFactory: async (opts: RabbitMQModuleOptions) => {
        const service = new RabbitMQService(opts);
        await service.onModuleInit();
        return service;
      },
      inject: [RABBITMQ_OPTIONS],
    };

    return {
      module: RabbitMQModule,
      providers: [asyncOptionsProvider, serviceProvider],
      exports: [RabbitMQService],
      global: true,
    };
  }
}