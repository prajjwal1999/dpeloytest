import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ToneEnum, StatusEnum, COLLECTION_NAMES, ChannelEnum } from '../utils';

export type ContentRequestDocument = ContentRequest & Document;

@Schema({
  timestamps: true,
  collection: COLLECTION_NAMES.CONTENT_REQUESTS,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ContentRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ type: [String], required: true })
  keyBenefits: string[];

  @Prop({ required: true, trim: true })
  targetAudience: string;

  @Prop({ 
    type: String, 
    enum: Object.values(ToneEnum), 
    required: true 
  })
  tone: ToneEnum;

  @Prop({ 
    type: [String], 
    enum: Object.values(ChannelEnum),
    required: true 
  })
  channels: ChannelEnum[];

  @Prop({ 
    type: String, 
    enum: Object.values(StatusEnum), 
    default: StatusEnum.PENDING,
    index: true
  })
  status: StatusEnum;
}

export const ContentRequestSchema = SchemaFactory.createForClass(ContentRequest);

// Compound indexes for efficient querying
ContentRequestSchema.index({ userId: 1, status: 1 });
ContentRequestSchema.index({ status: 1, createdAt: -1 });
ContentRequestSchema.index({ userId: 1, createdAt: -1 });
