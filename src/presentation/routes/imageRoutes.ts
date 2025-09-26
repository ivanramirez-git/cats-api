import { Router } from 'express';
import { ImageController } from '../../infrastructure/controllers/ImageController';
import { AuthMiddleware } from '../../infrastructure/middlewares/AuthMiddleware';

/**
 * @swagger
 * components:
 *   schemas:
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
 */

export function createImageRoutes(
  imageController: ImageController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  /**
   * @swagger
   * /api/images/imagesbybreedid:
   *   get:
   *     summary: Obtener imágenes por ID de raza (requiere autenticación)
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: breed_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la raza de gato
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Número máximo de imágenes a retornar
   *     responses:
   *       200:
   *         description: Imágenes obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/CatImage'
   *       400:
   *         description: Parámetro breed_id requerido
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
  router.get('/imagesbybreedid', authMiddleware.authenticate, imageController.getImagesByBreedId);

  return router;
}