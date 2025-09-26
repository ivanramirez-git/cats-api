import dotenv from 'dotenv';

dotenv.config();

export const validateEnv = (): void => {
  const requiredVars = ['MONGODB_URI', 'THE_CAT_API_KEY', 'JWT_SECRET'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Variable de entorno requerida no encontrada: ${varName}`);
    }
  }
};

export const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno no encontrada: ${name}`);
  }
  return value;
};