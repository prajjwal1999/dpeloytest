import { Types } from 'mongoose';
import { UserPreferencesDto, UserContextDto } from './create-user.dto';

export class UserResponseDto {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  preferences: UserPreferencesDto;
  context: UserContextDto;
  isOnboarded: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  totalContentRequests: number;
  subscriptionTier: string;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfileDto {
  _id: Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  preferences: UserPreferencesDto;
  totalContentRequests: number;
  subscriptionTier: string;
  isOnboarded: boolean;
}

export class OnboardingCompleteDto {
  userId: Types.ObjectId;
  isOnboarded: boolean;
  preferences: UserPreferencesDto;
  context: UserContextDto;
  completedAt: Date;
} 