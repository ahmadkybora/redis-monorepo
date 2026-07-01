import { Controller, Get, Delete, Param, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ========== Health Check ==========
  @Get('health')
  async health() {
    return await this.appService.getHealth();
  }

  // ========== مدیریت کش ==========
  @Get('cache/stats')
  async cacheStats() {
    return await this.appService.getCacheStats();
  }

  @Delete('cache/:key?')
  async clearCache(@Param('key') key?: string) {
    return await this.appService.clearCache(key);
  }

  // ========== مدیریت کاربران (از طریق RabbitMQ) ==========
  @Post('users')
  async createUser(@Body() body: { name: string; email: string }) {
    return await this.appService.createUser(body.name, body.email);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return await this.appService.getUser(id);
  }

  @Get('users')
  async getAllUsers() {
    return await this.appService.getAllUsers();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.appService.deleteUser(id);
  }

  // ========== تست RabbitMQ ==========
  @Post('test/rabbitmq')
  async testRabbitMQ() {
    return await this.appService.testRabbitMQ();
  }
}