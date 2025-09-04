import { 
  IsNotEmpty, 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum,
  IsArray,
  MaxLength,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ToneEnum, 
  ProductTypeEnum, 
  LanguageEnum, 
  ChannelEnum
} from '../../../utils';

export class UserPreferencesDto {
  @IsEnum(ToneEnum)
  defaultTone: ToneEnum;

  @IsEnum(LanguageEnum)
  defaultLanguage: LanguageEnum;

  @IsArray()
  @IsEnum(ChannelEnum, { each: true })
  preferredChannels: ChannelEnum[];

  @IsEnum(ProductTypeEnum)
  defaultProductType: ProductTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  brandVoice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}

export class UserContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  brandDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentCampaigns?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessGoals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitorInfo?: string[];

//   @IsOptional()
//   @IsString()
//   @MaxLength(100)
//   seasonalFocus?: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(50)
//   budgetRange?: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UserContextDto)
  context?: UserContextDto;

  @IsOptional()
  @IsString()
  subscriptionTier?: string;
} 