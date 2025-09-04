import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ContentRequestModule } from './modules/content-request/content-request.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration module
    ConfigModule,

    // Database module
    DatabaseModule,

    // Global caching
    CacheModule.register({
      isGlobal: true,
      ttl: 600, // 10 minutes
      max: 1000,
    }),

    // Feature modules
    AuthModule,
    UserModule,
    ContentRequestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
