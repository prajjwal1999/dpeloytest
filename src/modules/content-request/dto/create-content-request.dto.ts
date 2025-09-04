import { 
  IsNotEmpty, 
  IsString, 
  IsArray, 
  IsEnum, 
  IsMongoId, 
  ArrayMinSize,
  MaxLength,
  ArrayMaxSize
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { 
  ToneEnum, 
  ChannelEnum
} from '../../../utils';

export class CreateContentRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  productName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  keyBenefits: string[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  targetAudience: string;

  @IsEnum(ToneEnum)
  tone: ToneEnum;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsEnum(ChannelEnum, { each: true })
  channels: ChannelEnum[];
}
