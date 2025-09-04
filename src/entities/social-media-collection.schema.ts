import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChannelEnum, COLLECTION_NAMES } from '../utils';

export type SocialMediaCollectionDocument = SocialMediaCollection & Document;

@Schema({
  timestamps: true,
  collection: COLLECTION_NAMES.SOCIAL_MEDIA_COLLECTIONS,
})

export class SocialMediaCollection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ChannelEnum),
    required: true,
    index: true
  })
  channel: ChannelEnum;

  @Prop({ type: String, required: true, trim: true })
  productName: string;

  @Prop({ type: [String], required: true })
  keyBenefits: string[];

  @Prop({ type: String, required: true, trim: true })
  tone: string;

  @Prop({ type: Object, required: true })
  generatedContent: {
    title: string;
    body: string;
    cta: string;
    hashtags: string[];
    emojis: string[];
  };

  @Prop({ type: Types.ObjectId, ref: 'ContentRequest', required: true })
  requestId: Types.ObjectId;

  @Prop({ type: String, required: true })
  aiModel: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Date, default: null })
  createdAt?: Date;

  @Prop({ type: Date, default: null })
  updatedAt?: Date;
}

export const SocialMediaCollectionSchema = SchemaFactory.createForClass(SocialMediaCollection);

// Indexes for efficient querying and relationships
SocialMediaCollectionSchema.index({ userId: 1, channel: 1, createdAt: -1 });
SocialMediaCollectionSchema.index({ userId: 1, createdAt: -1 });
SocialMediaCollectionSchema.index({ channel: 1, createdAt: -1 });
SocialMediaCollectionSchema.index({ userId: 1, isArchived: 1 });
