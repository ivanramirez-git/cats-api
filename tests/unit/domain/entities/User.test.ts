import { User, UserRole, CreateUserRequest, LoginRequest, AuthResponse } from '../../../../src/domain/entities/User';

describe('User Domain Entities', () => {
  describe('User Interface', () => {
    it('should have correct structure for User interface', () => {
      // Arrange
      const user: User = {
        id: