import { Injectable } from '@nestjs/common';
import * as enTranslations from './translations/en.json';
import * as esTranslations from './translations/es.json';

export type SupportedLanguage = 'en' | 'es';

@Injectable()
export class I18nService {
  private translations: Record<SupportedLanguage, typeof enTranslations> = {
    en: enTranslations,
    es: esTranslations,
  };

  private defaultLanguage: SupportedLanguage = 'en';

  /**
   * Translate a key to the specified language
   * @param key - Translation key (e.g., 'auth.register.success')
   * @param lang - Language code (default: 'en')
   * @param params - Optional parameters to replace in the translation (e.g., { context: 'transacción' })
   * @returns Translated string
   */
  translate(
    key: string,
    lang: SupportedLanguage = this.defaultLanguage,
    params?: Record<string, string | number>,
  ): string {
    const keys = key.split('.');

    let value: unknown =
      this.translations[lang] || this.translations[this.defaultLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    let translated = typeof value === 'string' ? value : key;

    // Replace parameters in the translation
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        translated = translated.replace(
          new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'),
          String(paramValue),
        );
      }
    }

    return translated;
  }

  /**
   * Alias for translate method
   */
  t(
    key: string,
    lang?: SupportedLanguage,
    params?: Record<string, string | number>,
  ): string {
    return this.translate(key, lang, params);
  }
}
