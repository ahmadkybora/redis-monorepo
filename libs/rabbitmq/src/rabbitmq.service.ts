import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RabbitMQModuleOptions, RabbitMQMessage } from './rabbitmq.interfaces';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any;
  private channel: any;
  private options: RabbitMQModuleOptions;

  constructor(options: RabbitMQModuleOptions) {
    this.options = options;
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = `amqp://${this.options.username}:${this.options.password}@${this.options.host}:${this.options.port}${this.options.vhost ? '/' + this.options.vhost : ''}`;

      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      if (this.options.exchangeName) {
        await this.channel.assertExchange(
          this.options.exchangeName,
          'topic',
          { durable: true }
        );
      }

      await this.channel.assertQueue(
        this.options.queueName,
        { durable: true }
      );

      if (this.options.exchangeName && this.options.routingKey) {
        await this.channel.bindQueue(
          this.options.queueName,
          this.options.exchangeName,
          this.options.routingKey
        );
      }

      console.log(`✅ RabbitMQ connected: ${this.options.queueName}`);
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('RabbitMQ disconnected');
    } catch (error) {
      console.error('Error disconnecting RabbitMQ:', error);
    }
  }

  async publish(pattern: string, data: any, options?: any): Promise<void> {
    const message: RabbitMQMessage = {
      pattern,
      data,
      id: this.generateId(),
      timestamp: new Date(),
    };

    const buffer = Buffer.from(JSON.stringify(message));
    const target = this.options.exchangeName || this.options.queueName;
    const routingKey = this.options.exchangeName ? this.options.routingKey : '';

    this.channel.publish(
      target,
      routingKey,
      buffer,
      {
        persistent: true,
        ...options,
      }
    );
  }

  async consume(callback: (message: RabbitMQMessage) => Promise<void>) {
    await this.channel.consume(
      this.options.queueName,
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString()) as RabbitMQMessage;
            await callback(content);
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  async send<T = any>(pattern: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const correlationId = this.generateId();
      const replyQueue = 'amq.rabbitmq.reply-to';

      this.channel.consume(
        replyQueue,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            try {
              const response = JSON.parse(msg.content.toString());
              resolve(response);
              this.channel.ack(msg);
            } catch (error) {
              reject(error);
            }
          }
        },
        { noAck: false }
      );

      const message: RabbitMQMessage = {
        pattern,
        data,
        id: correlationId,
        timestamp: new Date(),
      };

      const buffer = Buffer.from(JSON.stringify(message));
      const target = this.options.exchangeName || this.options.queueName;
      const routingKey = this.options.exchangeName ? this.options.routingKey : '';

      this.channel.publish(
        target,
        routingKey,
        buffer,
        {
          persistent: true,
          correlationId,
          replyTo: replyQueue,
        }
      );

      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  getConnection(): amqp.Connection {
    return this.connection;
  }
}