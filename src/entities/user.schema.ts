import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { 
  ToneEnum, 
  ProductTypeEnum, 
  LanguageEnum, 
  ChannelEnum,
  COLLECTION_NAMES 
} from '../utils';

export type UserDocument = User & Document;

// User preferences for AI context
export interface UserPreferences {
  defaultTone: ToneEnum;
  defaultLanguage: LanguageEnum;
  preferredChannels: ChannelEnum[];
  defaultProductType: ProductTypeEnum;
  brandVoice?: string;
  targetAudience?: string;
  businessType?: string;
  location?: string;
}

// User context for AI conversations
export interface UserContext {
  brandName?: string;
  brandDescription?: string;
  recentCampaigns?: string[];
  businessGoals?: string[];
  targetMarkets?: string[];
  competitorInfo?: string[];
  seasonalFocus?: string;
  budgetRange?: string;
}

@Schema({
  timestamps: true,
  collection: COLLECTION_NAMES.USERS,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

export class User {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  })
  email: string;

  @Prop({ 
    required: false, // Not required for Google users
    minlength: 6,
    select: false // Don't include password in queries by default
  })
  password?: string;

  @Prop({ 
    required: true, 
    trim: true,
    enum: ['admin', 'user', 'premium_user', 'enterprise'],
    default: 'user'
  })
  role: string;

  @Prop({ trim: true, maxlength: 20 })
  phone?: string;

  @Prop({ trim: true, maxlength: 100 })
  company?: string;

  @Prop({ trim: true, maxlength: 100 })
  jobTitle?: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop()
  picture?: string;

  @Prop({ 
    type: Object,
    default: () => ({
      defaultTone: ToneEnum.CASUAL,
      defaultLanguage: LanguageEnum.EN,
      preferredChannels: [ChannelEnum.INSTAGRAM, ChannelEnum.FACEBOOK],
      defaultProductType: ProductTypeEnum.BEAUTY,
    })
  })
  preferences: UserPreferences;

  @Prop({ 
    type: Object,
    default: () => ({})
  })
  context: UserContext;

  @Prop({ type: String })
  generatedBrandContext?: string;

  @Prop({ default: false })
  isOnboarded: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: true })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationTokenExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetTokenExpires?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'ContentRequest' })
  contentRequestHistory: Types.ObjectId[];

  @Prop({ default: 0 })
  totalContentRequests: number;

  @Prop({ 
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  })
  subscriptionTier: string;

  @Prop()
  subscriptionExpiresAt?: Date;

  // Usage tracking for context optimization
  @Prop({ 
    type: Object,
    default: () => ({
      mostUsedTones: [],
      mostUsedChannels: [],
      mostUsedProductTypes: [],
      averageContentLength: 0,
      preferredAIModel: 'gpt-4o'
    })
  })
  usageAnalytics: {
    mostUsedTones: ToneEnum[];
    mostUsedChannels: ChannelEnum[];
    mostUsedProductTypes: ProductTypeEnum[];
    averageContentLength: number;
    preferredAIModel: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
