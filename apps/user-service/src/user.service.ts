import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { RabbitMQService } from '@app/rabbitmq';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    // شروع به گوش دادن به پیام‌های RabbitMQ
    await this.rabbitMQService.consume(async (message) => {
      console.log('📨 Received message:', message.pattern, message.data);
      
      switch (message.pattern) {
        case 'user.create':
          await this.handleCreateUser(message.data);
          break;
        case 'user.get':
          await this.handleGetUser(message.data);
          break;
        case 'user.getAll':
          await this.handleGetAllUsers();
          break;
        case 'user.delete':
          await this.handleDeleteUser(message.data);
          break;
        default:
          console.warn('Unknown pattern:', message.pattern);
      }
    });
  }

  // ========== هندلرهای پیام ==========
  private async handleCreateUser(data: { name: string; email: string }) {
    const user = await this.createUser(data.name, data.email);
    // ارسال پاسخ به Gateway (اگر نیاز باشه)
    // اینجا می‌تونید پیام رو به Queue دیگه‌ای بفرستید
    console.log('✅ User created:', user);
  }

  private async handleGetUser(data: { id: string }) {
    const user = await this.getUser(data.id);
    console.log('📤 User retrieved:', user);
    // می‌توانید پاسخ رو به Queue پاسخ بفرستید
  }

  private async handleGetAllUsers() {
    const users = await this.getAllUsers();
    console.log('📤 All users retrieved:', users.length);
  }

  private async handleDeleteUser(data: { id: string }) {
    await this.deleteUser(data.id);
    console.log('🗑️ User deleted:', data.id);
  }

  // ========== متدهای اصلی бизнес ==========
  async createUser(name: string, email: string): Promise<User> {
    const user: User = {
      id: uuidv4(),
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.redisService.hset('users', user.id, user, 'default');
    await this.redisService.set(`user:${user.id}`, user, 3600, 'cache');

    // ارسال رویداد به RabbitMQ برای اطلاع سایر سرویس‌ها
    await this.rabbitMQService.publish('user.created', {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return user;
  }

  async getUser(id: string): Promise<User | null> {
    const cached = await this.redisService.get(`user:${id}`, 'cache');
    if (cached) {
      console.log('📦 From cache:', id);
      return cached;
    }

    const user = await this.redisService.hget('users', id, 'default');
    if (user) {
      await this.redisService.set(`user:${id}`, user, 3600, 'cache');
      return user;
    }

    return null;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.redisService.getClient('default').hgetall('users');
    return Object.values(users).map((u) => JSON.parse(u));
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.redisService.del(`user:${id}`, 'cache');
    const result = await this.redisService.getClient('default').hdel('users', id);
    
    if (result > 0) {
      await this.rabbitMQService.publish('user.deleted', { userId: id });
    }
    
    return result > 0;
  }
}