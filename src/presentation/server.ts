import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { appConfig } from '../config/config';
import { createCatRoutes } from './routes/catRoutes';
import { createUserRoutes } from './routes/userRoutes';
import { createImageRoutes } from './routes/imageRoutes';
import { ErrorMiddleware } from '../infrastructure/middlewares/ErrorMiddleware';
import { AuthMiddleware } from '../infrastructure/middlewares/AuthMiddleware';
import { CatController } from '../infrastructure/controllers/CatController';
import { UserController } from '../infrastructure/controllers/UserController';
import { ImageController } from '../infrastructure/controllers/ImageController';
import { JwtService } from '../infrastructure/adapters/jwt/JwtService';
import { CatApiClient } from '../infrastructure/adapters/api-client/CatApiClient';
import { CatRepository } from '../infrastructure/adapters/repositories/CatRepository';
import { UserRepository } from '../infrastructure/adapters/repositories/UserRepository';
import { GetBreeds } from '../application/use-cases/cats/GetBreeds';
import { SearchBreeds } from '../application/use-cases/cats/SearchBreeds';
import { GetBreedById } from '../application/use-cases/cats/GetBreedById';
import { GetImagesByBreedId } from '../application/use-cases/images/GetImagesByBreedId';
import { RegisterUser } from '../application/use-cases/users/RegisterUser';
import { LoginUser } from '../application/use-cases/users/LoginUser';

export class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = appConfig.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    // Inyección de dependencias
    const jwtService = new JwtService();
    const authMiddleware = new AuthMiddleware(jwtService);
    
    const catApiClient = new CatApiClient();
    const catRepository = new CatRepository(catApiClient);
    const userRepository = new UserRepository();
    
    const getBreedsUseCase = new GetBreeds(catRepository);
    const searchBreedsUseCase = new SearchBreeds(catRepository);
    const getBreedByIdUseCase = new GetBreedById(catRepository);
    const getImagesByBreedIdUseCase = new GetImagesByBreedId(catRepository);
    const registerUserUseCase = new RegisterUser(userRepository);
    const loginUserUseCase = new LoginUser(userRepository, jwtService);
    
    const catController = new CatController(
      getBreedsUseCase,
      getBreedByIdUseCase,
      searchBreedsUseCase
    );
    
    const imageController = new ImageController(
      getImagesByBreedIdUseCase
    );
    
    const userController = new UserController(
      registerUserUseCase,
      loginUserUseCase
    );

    // Rutas
    this.app.use('/api/cats', createCatRoutes(catController, authMiddleware));
    this.app.use('/api/images', createImageRoutes(imageController, authMiddleware));
    this.app.use('/api/users', createUserRoutes(userController));
    
    // Ruta de salud
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Cat API',
          version: '1.0.0',
          description: 'API para gestión de razas de gatos'
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Servidor de desarrollo'
          }
        ]
      },
      apis: [
        './src/presentation/routes/userRoutes.ts',
        './src/presentation/routes/catRoutes.ts',
        './src/presentation/routes/imageRoutes.ts',
        './dist/presentation/routes/*.js'
      ]
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.handle);
  }

  public async start(): Promise<void> {
    try {
      await mongoose.connect(appConfig.mongoUri);
      console.log('Conectado a MongoDB');
      
      this.app.listen(this.port, () => {
        console.log(`Servidor ejecutándose en puerto ${this.port}`);
        console.log(`Documentación disponible en http://localhost:${this.port}/api-docs`);
      });
    } catch (error) {
      console.error('Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }
}