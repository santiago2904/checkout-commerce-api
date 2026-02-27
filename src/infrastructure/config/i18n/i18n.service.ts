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
   * @returns Translated string
   */
  translate(
    key: string,
    lang: SupportedLanguage = this.defaultLanguage,
  ): string {
    const keys = key.split('.');

    let value: any =
      this.translations[lang] || this.translations[this.defaultLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Alias for translate method
   */
  t(key: string, lang?: SupportedLanguage): string {
    return this.translate(key, lang);
  }
}
