import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@infrastructure/modules/database.module';
import { AuthModule } from '@infrastructure/modules/auth.module';
import { CheckoutModule } from '@infrastructure/modules/checkout.module';
import { ProductModule } from './product/product.module';
import wompiConfig from '@infrastructure/adapters/payment/wompi/wompi.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [wompiConfig], // Register Wompi configuration
    }),
    DatabaseModule,
    AuthModule,
    CheckoutModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
