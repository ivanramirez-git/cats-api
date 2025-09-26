import { Request, Response, NextFunction } from 'express';
import { ImageController } from '../../../../src/infrastructure/controllers/ImageController';
import { GetImagesByBreedId } from '../../../../src/application/use-cases/images/GetImagesByBreedId';
import { Cat } from '../../../../src/domain/entities/Cat';

// Mock the use case
jest.mock('../../../../src/application/use-cases/images/GetImagesByBreedId');

describe('ImageController', () => {
  let imageController: ImageController;
  let mockGetImagesByBreedIdUseCase: jest.Mocked<GetImagesByBreedId>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockImages: Cat[] = [
    {
      id: 'img1',
      url: 'https://example.com/cat1.jpg',
      width: 800,
      height: 600,
      breeds: []
    },
    {
      id: 'img2',
      url: 'https://example.com/cat2.jpg',
      width: 1024,
      height: 768,
      breeds: []
    }
  ];

  beforeEach(() => {
    // Create mock use case
    mockGetImagesByBreedIdUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<GetImagesByBreedId>;

    // Create controller instance
    imageController = new ImageController(mockGetImagesByBreedIdUseCase);

    // Setup mock request and response
    mockRequest = {
      query: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getImagesByBreedId', () => {
    it('should return images for valid breed_id', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return images with limit parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys', limit: '5' };
      const limitedImages = mockImages.slice(0, 1);
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(limitedImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', 5);
      expect(mockResponse.json).toHaveBeenCalledWith(limitedImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when breed_id is missing', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'breed_id es requerido como parámetro de consulta'
      });
      expect(mockGetImagesByBreedIdUseCase.execute).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when breed_id is empty string', async () => {
      // Arrange
      mockRequest.query = { breed_id: '' };

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'breed_id es requerido como parámetro de consulta'
      });
      expect(mockGetImagesByBreedIdUseCase.execute).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no images found', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'nonexistent' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue([]);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('nonexistent', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle use case errors by calling next', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      const error = new Error('Use case error');
      mockGetImagesByBreedIdUseCase.execute.mockRejectedValue(error);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', undefined);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle invalid limit parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys', limit: 'invalid' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', NaN);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle zero limit parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys', limit: '0' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue([]);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', 0);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle negative limit parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys', limit: '-5' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', -5);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle array breed_id parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: ['abys', 'beng'] as any };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith(['abys', 'beng'], undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle very large limit parameter', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys', limit: '999999' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', 999999);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle special characters in breed_id', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'test-breed_123' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('test-breed_123', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockImages);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockGetImagesByBreedIdUseCase.execute.mockRejectedValue(timeoutError);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(timeoutError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle null response from use case', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(null as any);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(null);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined response from use case', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(undefined as any);

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledWith('abys', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(undefined);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed request objects', async () => {
      // Arrange
      const malformedRequest = {} as Request; // No query property
      const error = new TypeError("Cannot read properties of undefined (reading 'breed_id')");

      // Act
      await imageController.getImagesByBreedId(
        malformedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle response object errors', async () => {
      // Arrange
      mockRequest.query = { breed_id: 'abys' };
      mockGetImagesByBreedIdUseCase.execute.mockResolvedValue(mockImages);
      const responseError = new Error('Response error');
      (mockResponse.json as jest.Mock).mockImplementation(() => {
        throw responseError;
      });

      // Act
      await imageController.getImagesByBreedId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(responseError);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const request1 = { query: { breed_id: 'abys' } } as unknown as Request;
      const request2 = { query: { breed_id: 'beng', limit: '3' } } as unknown as Request;
      const response1 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const response2 = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const next1 = jest.fn();
      const next2 = jest.fn();

      mockGetImagesByBreedIdUseCase.execute
        .mockResolvedValueOnce([mockImages[0]])
        .mockResolvedValueOnce([mockImages[1]]);

      // Act
      await Promise.all([
        imageController.getImagesByBreedId(request1, response1, next1),
        imageController.getImagesByBreedId(request2, response2, next2)
      ]);

      // Assert
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenNthCalledWith(1, 'abys', undefined);
      expect(mockGetImagesByBreedIdUseCase.execute).toHaveBeenNthCalledWith(2, 'beng', 3);
      expect(response1.json).toHaveBeenCalledWith([mockImages[0]]);
      expect(response2.json).toHaveBeenCalledWith([mockImages[1]]);
    });

    it('should handle mixed success and error scenarios', async () => {
      // Arrange
      const successRequest = { query: { breed_id: 'abys' } } as unknown as Request;
      const errorRequest = { query: { breed_id: 'invalid' } } as unknown as Request;
      const successResponse = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const errorResponse = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
      const successNext = jest.fn();
      const errorNext = jest.fn();
      const error = new Error('Breed not found');

      mockGetImagesByBreedIdUseCase.execute
        .mockResolvedValueOnce(mockImages)
        .mockRejectedValueOnce(error);

      // Act
      await Promise.all([
        imageController.getImagesByBreedId(successRequest, successResponse, successNext),
        imageController.getImagesByBreedId(errorRequest, errorResponse, errorNext)
      ]);

      // Assert
      expect(successResponse.json).toHaveBeenCalledWith(mockImages);
      expect(successNext).not.toHaveBeenCalled();
      expect(errorNext).toHaveBeenCalledWith(error);
      expect(errorResponse.json).not.toHaveBeenCalled();
    });
  });
});