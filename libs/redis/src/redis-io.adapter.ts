import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private readonly app: any,
    private readonly redisService: RedisService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    // دریافت کلاینت‌ها از سرویس Redis
    const pubClient = this.redisService.getClient('default');
    const subClient = pubClient.duplicate();

    // برای ioredis، وضعیت اتصال با 'status' چک می‌شود
    if (pubClient.status !== 'ready') {
      await pubClient.connect();
    }
    if (subClient.status !== 'ready') {
      await subClient.connect();
    }

    // ساخت آداپتور Redis برای Socket.IO
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}