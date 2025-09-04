import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { 
  ToneEnum, 
  StatusEnum, 
  ChannelEnum
} from '../../../utils';

export class ContentRequestResponseDto {
  _id: Types.ObjectId;

  userId: Types.ObjectId;

  productName: string;

  keyBenefits: string[];

  targetAudience: string;

  tone: ToneEnum;

  channels: ChannelEnum[];

  status: StatusEnum;

  generatedContent?: string;

  createdAt: Date;

  updatedAt: Date;
}
