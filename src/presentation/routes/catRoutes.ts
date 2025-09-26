import { Router } from 'express';
import { CatController } from '../../infrastructure/controllers/CatController';
import { AuthMiddleware } from '../../infrastructure/middlewares/AuthMiddleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     CatBreed:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la raza
 *         name:
 *           type: string
 *           description: Nombre de la raza
 *         description:
 *           type: string
 *           description: Descripción de la raza
 *         origin:
 *           type: string
 *           description: País de origen
 *         temperament:
 *           type: string
 *           description: Temperamento de la raza
 *         life_span:
 *           type: string
 *           description: Esperanza de vida
 *         weight:
 *           type: object
 *           properties:
 *             imperial:
 *               type: string
 *               description: Peso en libras
 *             metric:
 *               type: string
 *               description: Peso en kilogramos
 *     CatImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la imagen
 *         url:
 *           type: string
 *           format: uri
 *           description: URL de la imagen
 *         width:
 *           type: integer
 *           description: Ancho de la imagen
 *         height:
 *           type: integer
 *           description: Alto de la imagen
 *         breeds:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CatBreed'
 *           description: Razas asociadas a la imagen
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export function createCatRoutes(
  catController: CatController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  /**
   * @swagger
   * /api/cats/breeds:
   *   get:
   *     summary: Obtener todas las razas de gatos (requiere autenticación)
   *     tags: [Cats]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de razas obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/CatBreed'
   *       401:
   *         description: Token de autenticación requerido o inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/breeds', authMiddleware.authenticate, catController.getBreeds);

  /**
   * @swagger
   * /api/cats/breeds/{breed_id}:
   *   get:
   *     summary: Obtener una raza específica por ID (requiere autenticación)
   *     tags: [Cats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: breed_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la raza de gato
   *     responses:
   *       200:
   *         description: Raza obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CatBreed'
   *       401:
   *         description: Token de autenticación requerido o inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Raza no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/breeds/:breed_id', authMiddleware.authenticate, catController.getBreedById);

  /**
   * @swagger
   * /api/cats/breeds/search:
   *   get:
   *     summary: Buscar razas de gatos por nombre (requiere autenticación)
   *     tags: [Cats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Término de búsqueda para el nombre de la raza
   *     responses:
   *       200:
   *         description: Razas encontradas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/CatBreed'
   *       400:
   *         description: Parámetro de búsqueda requerido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Token de autenticación requerido o inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/breeds/search', authMiddleware.authenticate, catController.searchBreeds);

  return router;
}