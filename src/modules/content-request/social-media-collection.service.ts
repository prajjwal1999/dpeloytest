import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialMediaCollection, SocialMediaCollectionDocument } from '../../entities';
import { ChannelEnum } from '../../utils';

export interface ContentHistoryItem {
  productName: string;
  keyBenefits: string[];
  tone: string;
  generatedContent: {
    title: string;
    body: string;
    cta: string;
    hashtags: string[];
    emojis: string[];
  };
  createdAt: Date;
  aiModel: string;
}

@Injectable()
export class SocialMediaCollectionService {
  private readonly logger = new Logger(SocialMediaCollectionService.name);

  constructor(
    @InjectModel(SocialMediaCollection.name)
    private readonly socialMediaCollectionModel: Model<SocialMediaCollectionDocument>,
  ) {}

  async saveContentToCollection(
    userId: Types.ObjectId,
    channel: ChannelEnum,
    productName: string,
    keyBenefits: string[],
    tone: string,
    generatedContent: {
      title: string;
      body: string;
      cta: string;
      hashtags: string[];
      emojis: string[];
    },
    requestId: Types.ObjectId,
    aiModel: string,
    metadata?: Record<string, any>
  ): Promise<SocialMediaCollectionDocument> {
    this.logger.log(`Saving content to collection for user: ${userId}, channel: ${channel}`);

    const socialMediaContent = new this.socialMediaCollectionModel({
      userId,
      channel,
      productName,
      keyBenefits,
      tone,
      generatedContent,
      requestId,
      aiModel,
      metadata: metadata || {},
      isArchived: false,
    });

    const savedContent = await socialMediaContent.save();
    this.logger.log(`Content saved to collection with ID: ${savedContent._id}`);

    return savedContent;
  }

  async getUserContentHistory(
    userId: Types.ObjectId,
    channel?: ChannelEnum,
    limit: number = 10
  ): Promise<ContentHistoryItem[]> {
    this.logger.log(`Fetching content history for user: ${userId}, channel: ${channel}`);

    const query: any = { 
      userId,
      isArchived: false,
    };

    if (channel) {
      query.channel = channel;
    }

    const contents = await this.socialMediaCollectionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return contents.map(content => ({
      productName: content.productName,
      keyBenefits: content.keyBenefits,
      tone: content.tone,
      generatedContent: content.generatedContent,
      createdAt: content.createdAt,
      aiModel: content.aiModel,
    }));
  }

  async getLastNGeneratedContents(
    userId: Types.ObjectId,
    limit: number = 10
  ): Promise<string[]> {
    this.logger.log(`Fetching last ${limit} generated contents for user: ${userId}`);

    const contents = await this.socialMediaCollectionModel
      .find({ 
        userId,
        isArchived: false,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return contents.map(content => {
      const { title, body, cta, hashtags } = content.generatedContent;
      return `Title: ${title}\nContent: ${body}\nCTA: ${cta}\nHashtags: ${hashtags.join(' ')}`;
    });
  }

  async getUserChannelStats(userId: Types.ObjectId): Promise<Record<string, number>> {
    this.logger.log(`Fetching channel stats for user: ${userId}`);

    const stats = await this.socialMediaCollectionModel.aggregate([
      { 
        $match: { 
          userId: new Types.ObjectId(userId),
          isArchived: false,
        } 
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 }
        }
      }
    ]);

    const result: Record<string, number> = {};
    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  async archiveOldContent(userId: Types.ObjectId, keepLast: number = 50): Promise<void> {
    this.logger.log(`Archiving old content for user: ${userId}, keeping last ${keepLast}`);

    const contents = await this.socialMediaCollectionModel
      .find({ 
        userId,
        isArchived: false,
      })
      .sort({ createdAt: -1 })
      .skip(keepLast)
      .select('_id')
      .lean()
      .exec();

    if (contents.length > 0) {
      const idsToArchive = contents.map(content => content._id);
      await this.socialMediaCollectionModel.updateMany(
        { _id: { $in: idsToArchive } },
        { isArchived: true }
      );

      this.logger.log(`Archived ${contents.length} old content items for user: ${userId}`);
    }
  }
} 