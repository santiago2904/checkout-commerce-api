import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupportedLanguage } from '@infrastructure/config/i18n';

/**
 * Decorator to extract language from request headers
 * Reads from 'Accept-Language' header, defaults to 'en'
 *
 * @example
 * async register(@Body() registerDto: RegisterDto, @Lang() lang: SupportedLanguage) {
 *   // lang will be 'es' if header is 'Accept-Language: es'
 * }
 */
export const Lang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupportedLanguage => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers: { 'accept-language'?: string } }>();
    const acceptLanguage = request.headers['accept-language'];

    // Parse language from header (e.g., 'es-MX' -> 'es', 'en-US' -> 'en')
    if (acceptLanguage) {
      const lang = acceptLanguage.split('-')[0].toLowerCase();
      if (lang === 'es' || lang === 'en') {
        return lang as SupportedLanguage;
      }
    }

    return 'en'; // Default language
  },
);
