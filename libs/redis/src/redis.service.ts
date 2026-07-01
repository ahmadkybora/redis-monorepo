import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENTS } from './redis.constants';

@Injectable()
export class RedisService {
  private clients: Map<string, Redis> = new Map();

  constructor(@Inject(REDIS_CLIENTS) redisClients: Map<string, Redis>) {
    this.clients = redisClients;
  }

  getClient(name: string = 'default'): Redis {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Redis connection "${name}" not found`);
    }
    return client;
  }

  async set(key: string, value: any, ttl?: number, connection?: string) {
    const client = this.getClient(connection);
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      return await client.set(key, data, 'EX', ttl);
    }
    return await client.set(key, data);
  }

  async get(key: string, connection?: string) {
    const client = this.getClient(connection);
    const data = await client.get(key);
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async del(key: string, connection?: string) {
    const client = this.getClient(connection);
    return await client.del(key);
  }

  async hset(hash: string, field: string, value: any, connection?: string) {
    const client = this.getClient(connection);
    return await client.hset(hash, field, JSON.stringify(value));
  }

  async hget(hash: string, field: string, connection?: string) {
    const client = this.getClient(connection);
    const data = await client.hget(hash, field);
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
}