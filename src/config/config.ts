import { getEnvVar } from './env';

export interface IAppConfig {
  port: number;
  mongoUri: string;
  catApiKey: string;
  jwtSecret: string;
  jwtExpiresIn: string | number;
  environment: string;
  cors: {
    origin: string[];
  };
  server: {
    host: string;
    baseUrl: string;
  };
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const isDockerLocal = process.env.DOCKER_LOCAL === 'true';

export const appConfig: IAppConfig = {
  port: parseInt(getEnvVar('PORT') || '3000', 10),
  mongoUri: getEnvVar('MONGODB_URI'),
  catApiKey: getEnvVar('THE_CAT_API_KEY'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN') || '24h',
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: isDevelopment || isDockerLocal
      ? ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:3000', 'http://localhost']
      : ['https://cats.freeloz.com']
  },
  server: {
    host: isDevelopment ? 'localhost' : 'cats-api.freeloz.com',
    baseUrl: isDevelopment ? 'http://localhost:3000' : 'https://cats-api.freeloz.com'
  }
};