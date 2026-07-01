import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { RabbitMQService } from '@app/rabbitmq';

@Injectable()
export class AppService {
  constructor(
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async getHealth() {
    try {
      await this.redisService.set('health_check', 'ok', 10, 'default');
      const status = await this.redisService.get('health_check', 'default');
      
      return {
        status: 'ok',
        redis: status === 'ok' ? 'connected' : 'error',
        rabbitmq: this.rabbitMQService.getConnection() ? 'connected' : 'error',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        redis: 'disconnected',
        rabbitmq: 'disconnected',
        error: error.message,
      };
    }
  }

  // ========== متدهای User با RabbitMQ ==========
  async createUser(name: string, email: string) {
    // ارسال پیام به Queue و منتظر پاسخ
    return await this.rabbitMQService.send('user.create', { name, email });
  }

  async getUser(id: string) {
    return await this.rabbitMQService.send('user.get', { id });
  }

  async getAllUsers() {
    return await this.rabbitMQService.send('user.getAll', {});
  }

  async deleteUser(id: string) {
    return await this.rabbitMQService.send('user.delete', { id });
  }

  // ========== مدیریت کش ==========
  async getCacheStats() {
    const client = this.redisService.getClient('cache');
    const info = await client.info('stats');
    return {
      stats: info,
      connections: {
        default: this.redisService.getClient('default') ? 'active' : 'inactive',
        cache: this.redisService.getClient('cache') ? 'active' : 'inactive',
      },
    };
  }

  async clearCache(key?: string) {
    if (key) {
      await this.redisService.del(key, 'cache');
      return { message: `Cache key "${key}" cleared` };
    } else {
      const client = this.redisService.getClient('cache');
      await client.flushdb();
      return { message: 'All cache cleared' };
    }
  }

  // ========== تست RabbitMQ ==========
  async testRabbitMQ() {
    await this.rabbitMQService.publish('test.message', {
      text: 'Hello from API Gateway!',
      timestamp: new Date().toISOString(),
    });
    
    return { message: 'Test message sent to RabbitMQ' };
  }
}