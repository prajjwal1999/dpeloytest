import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class GeneratedContentMetaDto {
  @ApiProperty({
    description: 'Hashtags for social media',
    example: ['#SustainableBeauty', '#GlowNaturally'],
    type: [String],
  })
  hashtags: string[];

  @ApiProperty({
    description: 'Emojis used in the content',
    example: ['🌿', '✨'],
    type: [String],
  })
  emojis: string[];
}

export class GeneratedContentDto {
  @ApiProperty({
    description: 'Social media channel',
    example: 'Instagram',
  })
  channel: string;

  @ApiProperty({
    description: 'Content language',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Content tone',
    example: 'casual',
  })
  tone: string;

  @ApiProperty({
    description: 'Content title',
    example: '✨ Glow Naturally ✨',
  })
  title: string;

  @ApiProperty({
    description: 'Content body text',
    example: 'Your skin deserves the best of nature. Say goodbye to chemicals and hello to eco-love 🌿',
  })
  body: string;

  @ApiProperty({
    description: 'Call to action text',
    example: 'Shop Now',
  })
  cta: string;

  @ApiProperty({
    description: 'Content metadata',
    type: GeneratedContentMetaDto,
  })
  meta: GeneratedContentMetaDto;
}

export class GeneratedContentResponseDto {
  @ApiProperty({
    description: 'Generated content ID',
    example: new Types.ObjectId(),
  })
  _id: Types.ObjectId;

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
    description: 'Type of content generated',
    example: 'ad_copy',
  })
  contentType: string;

  @ApiProperty({
    description: 'Generated content details',
    type: GeneratedContentDto,
  })
  content: GeneratedContentDto;

  @ApiProperty({
    description: 'Content status',
    example: 'draft',
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: new Date(),
  })
  createdAt: Date;
}
