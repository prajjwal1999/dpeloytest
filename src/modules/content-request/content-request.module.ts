import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

// Entities
import { 
  ContentRequest, 
  ContentRequestSchema,
  GeneratedContent, 
  GeneratedContentSchema,
  MessageHistory,
  MessageHistorySchema,
  User,
  UserSchema,
} from '../../entities';
import { SocialMediaCollection, SocialMediaCollectionSchema } from '../../entities/social-media-collection.schema';

// Controllers
import { ContentRequestController } from './content-request.controller';

// Services
import { ContentRequestService } from './content-request.service';
import { AIService } from './ai.service';
import { SocialMediaCollectionService } from './social-media-collection.service';

// Utils
import { CONTENT_CONSTANTS } from '../../utils';

/**
 * Content Request Feature Module
 * Handles all content generation related functionality
 */
@Module({
  imports: [
    // Register schemas for this feature
    MongooseModule.forFeature([
      { name: ContentRequest.name, schema: ContentRequestSchema },
      { name: GeneratedContent.name, schema: GeneratedContentSchema },
      { name: MessageHistory.name, schema: MessageHistorySchema },
      { name: User.name, schema: UserSchema },
      { name: SocialMediaCollection.name, schema: SocialMediaCollectionSchema },
    ]),
    
    // Feature-specific caching
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100,
    }),
  ],
  controllers: [ContentRequestController],
  providers: [ContentRequestService, AIService, SocialMediaCollectionService],
  exports: [ContentRequestService, AIService, SocialMediaCollectionService], // Export for use in other modules
})
export class ContentRequestModule {}
