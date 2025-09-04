import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

// Entities
import { User, UserSchema } from '../../entities/user.schema';

// Controllers
import { UserController } from './user.controller';

// Services
import { UserService } from './user.service';

/**
 * User Management Module
 * Handles user onboarding, profile management, and context for AI content generation
 */
@Module({
  imports: [
    // Register User schema
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    
    // Feature-specific caching for user data
    CacheModule.register({
      ttl: 600, // 10 minutes
      max: 200, // Cache up to 200 user records
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export UserService for use in other modules
})
export class UserModule {} 