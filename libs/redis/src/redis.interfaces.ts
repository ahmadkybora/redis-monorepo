export interface RedisModuleOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface RedisConnectionConfig {
  name: string;
  options: RedisModuleOptions;
}