import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageRoleEnum, COLLECTION_NAMES } from '../utils';

export type MessageHistoryDocument = MessageHistory & Document;

@Schema({
  timestamps: true,
  collection: COLLECTION_NAMES.MESSAGE_HISTORY,
})
export class MessageHistory {
  @Prop({ type: Types.ObjectId, ref: 'ContentRequest', required: true, index: true })
  requestId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(MessageRoleEnum), 
    required: true 
  })
  role: MessageRoleEnum;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  response: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const MessageHistorySchema = SchemaFactory.createForClass(MessageHistory);

// Indexes for efficient querying
MessageHistorySchema.index({ requestId: 1, timestamp: -1 });
MessageHistorySchema.index({ timestamp: -1 });
