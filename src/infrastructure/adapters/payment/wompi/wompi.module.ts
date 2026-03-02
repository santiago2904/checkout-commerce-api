import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WompiStrategy } from './wompi.strategy';
import wompiConfig from './wompi.config';
import { I18nService } from '@infrastructure/config/i18n';

@Module({
  imports: [
    ConfigModule.forFeature(wompiConfig),
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 5,
    }),
  ],
  providers: [WompiStrategy, I18nService],
  exports: [WompiStrategy],
})
export class WompiModule {}
