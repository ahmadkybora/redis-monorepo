export interface RabbitMQModuleOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  queueName: string;
  exchangeName?: string;
  routingKey?: string;
}

export interface RabbitMQMessage {
  pattern: string;
  data: any;
  id?: string;
  timestamp?: Date;
}