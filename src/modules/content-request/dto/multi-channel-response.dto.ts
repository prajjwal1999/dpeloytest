import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { GeneratedContentResponseDto } from './generated-content-response.dto';

export class MultiChannelContentResponseDto {
  @ApiProperty({
    description: 'Original request ID',
    example: new Types.ObjectId(),
  })
  requestId: Types.ObjectId;

  @ApiProperty({
    description: 'AI model used',
    example: 'gemini-pro',
  })
  model: string;

  @ApiProperty({
    description: 'Content for all channels',
    type: [GeneratedContentResponseDto],
  })
  channelContents: GeneratedContentResponseDto[];

  @ApiProperty({
    description: 'Total number of channels',
    example: 2,
  })
  totalChannels: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: new Date(),
  })
  createdAt: Date;
}
