import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { COLLECTION_NAMES, CONTENT_CONSTANTS } from '../utils';

export type GeneratedContentDocument = GeneratedContent & Document;

@Schema({
  timestamps: true,
  collection: COLLECTION_NAMES.GENERATED_CONTENTS,
})
export class GeneratedContent {
  @Prop({ type: Types.ObjectId, ref: 'ContentRequest', required: true, index: true })
  requestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  generatedText: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: String, trim: true })
  channel: string;

  @Prop({ type: Number, default: CONTENT_CONSTANTS.INITIAL_VERSION })
  version: number;

  @Prop({ type: Boolean, default: CONTENT_CONSTANTS.DEFAULT_PUBLISHED_STATE })
  isPublished: boolean;

  @Prop({ type: Date })
  publishedAt: Date;
}

export const GeneratedContentSchema = SchemaFactory.createForClass(GeneratedContent);

// Indexes for efficient querying
GeneratedContentSchema.index({ requestId: 1, version: -1 });
GeneratedContentSchema.index({ userId: 1, createdAt: -1 });
GeneratedContentSchema.index({ isPublished: 1, publishedAt: -1 });
