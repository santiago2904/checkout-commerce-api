import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Protects routes requiring authentication
 * Uses JWT strategy to validate tokens
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
