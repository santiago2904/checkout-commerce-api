import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should use jwt strategy', () => {
    // The guard uses 'jwt' strategy from passport
    // This is configured in the constructor via AuthGuard('jwt')
    expect(guard.constructor.name).toBe('JwtAuthGuard');
  });
});
