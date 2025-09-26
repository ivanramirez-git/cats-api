import { getEnvVar } from './env';

export interface IAppConfig {
  port: number;
  mongoUri: string;
  catApiKey: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export const appConfig: IAppConfig = {
  port: parseInt(getEnvVar('PORT') || '3000', 10),
  mongoUri: getEnvVar('MONGODB_URI'),
  catApiKey: getEnvVar('THE_CAT_API_KEY'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN') || '24h'
};