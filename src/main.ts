import dotenv from 'dotenv';
import { Server } from './presentation/server';
import { validateEnv } from './config/env';

// Cargar variables de entorno
dotenv.config();

async function bootstrap() {
  try {
    // Validar variables de entorno
    validateEnv();
    
    const server = new Server();
    await server.start();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();