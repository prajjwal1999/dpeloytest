import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { User, UserDocument } from '../../entities/user.schema';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserProfileDto,
  OnboardingCompleteDto,
  UserPreferencesDto,
  UserContextDto
} from './dto';
import { 
  HTTP_MESSAGES, 
  PAGINATION_CONSTANTS,
  ToneEnum,
  ChannelEnum,
  ProductTypeEnum,
  LanguageEnum
} from '../../utils';

export interface UserContextForAI {
  userPreferences: UserPreferencesDto;
  userContext: UserContextDto;
  recentActivity: {
    mostUsedTones: ToneEnum[];
    mostUsedChannels: ChannelEnum[];
    mostUsedProductTypes: ProductTypeEnum[];
    averageContentLength: number;
    preferredAIModel: string;
  };
  conversationHistory: string[];
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating new user: ${createUserDto.email}`);
    
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ 
        email: createUserDto.email 
      }).lean();

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Set default preferences if not provided
      const defaultPreferences = {
        defaultTone: ToneEnum.CASUAL,
        defaultLanguage: LanguageEnum.EN,
        preferredChannels: [ChannelEnum.INSTAGRAM, ChannelEnum.FACEBOOK],
        defaultProductType: ProductTypeEnum.BEAUTY,
        ...createUserDto.preferences
      };

      const user = new this.userModel({
        ...createUserDto,
        preferences: defaultPreferences,
        context: createUserDto.context || {},
        isOnboarded: false,
        isActive: true,
        totalContentRequests: 0,
        usageAnalytics: {
          mostUsedTones: [],
          mostUsedChannels: [],
          mostUsedProductTypes: [],
          averageContentLength: 0,
          preferredAIModel: 'gpt-4o'
        }
      });

      const savedUser = await user.save();
      
      // Generate and save brand context after user is created
      this.generateSimpleBrandContext(savedUser);
      await savedUser.save();
      
      this.logger.log(`User created successfully: ${savedUser._id}`);

      return this.transformToResponseDto(savedUser);
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${id}`);
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformToResponseDto(user);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by email: ${email}`);
    
    const user = await this.userModel.findOne({ email }).lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformToResponseDto(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id}`);
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id, 
      { ...updateUserDto, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User updated successfully: ${id}`);
    return this.transformToResponseDto(user);
  }

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferencesDto>
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user preferences: ${userId}`);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    this.logger.log(`User preferences updated: ${userId}`);
    return this.transformToResponseDto(user);
  }

  async getUserProfile(id: string): Promise<UserProfileDto> {
    this.logger.log(`Fetching user profile: ${id}`);
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      _id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      company: user.company,
      jobTitle: user.jobTitle,
      preferences: user.preferences,
      totalContentRequests: user.totalContentRequests,
      subscriptionTier: user.subscriptionTier,
      isOnboarded: user.isOnboarded
    };
  }

  async getAllUsers(
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT
  ) {
    this.logger.log(`Fetching users - page: ${page}, limit: ${limit}`);
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments({ isActive: true }),
    ]);

    return {
      users: users.map(user => this.transformToResponseDto(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deactivateUser(id: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${id}`);
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User deactivated: ${id}`);
    return this.transformToResponseDto(user);
  }

  private transformToResponseDto(user: any): UserResponseDto {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      company: user.company,
      jobTitle: user.jobTitle,
      preferences: user.preferences,
      context: user.context,
      isOnboarded: user.isOnboarded,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      totalContentRequests: user.totalContentRequests,
      subscriptionTier: user.subscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateSimpleBrandContext(user: UserDocument): string {
    const brandName = user.company || user.name;
    const brandDescription = `${user.name}${user.company ? ` from ${user.company}` : ''}${user.jobTitle ? `, ${user.jobTitle}` : ''} - A ${user.preferences.defaultProductType} business.`;
    
    // Generate GPT system prompt
    const gptSystemPrompt = `You are a professional marketing content creator specializing in ${user.preferences.defaultProductType} industry.
  
  BRAND IDENTITY:
  - Brand Name: ${brandName}
  - Brand Description: ${brandDescription}
  - Business Type: ${user.preferences.defaultProductType}
  - Target Audience: ${user.preferences.defaultProductType} consumers and general market
  
  CONTENT GUIDELINES:
  - Tone: ${user.preferences.defaultTone}
  - Language: ${user.preferences.defaultLanguage}
  - Preferred Channels: ${user.preferences.preferredChannels.join(', ')}
  - Content Style: Engaging, professional, and brand-consistent
  
  BUSINESS OBJECTIVES:
  - Increase brand awareness
  - Generate leads and conversions
  - Build customer relationships
  - Establish market presence
  
  TARGET MARKETS:
  - General market
  - ${user.preferences.defaultProductType} consumers
  - Industry professionals
  
  CONTENT REQUIREMENTS:
  - Create platform-appropriate content for ${user.preferences.preferredChannels.join(' and ')}
  - Use ${user.preferences.defaultTone} tone throughout
  - Focus on ${user.preferences.defaultProductType} benefits and value propositions
  - Include relevant hashtags and calls-to-action
  - Maintain brand voice consistency
  - Optimize for engagement and conversions
  
  Remember: Always create content that aligns with ${brandName}'s brand identity and resonates with the target audience. Keep the tone ${user.preferences.defaultTone} and focus on ${user.preferences.defaultProductType} industry insights and benefits.
  Dont create anything now but keep this in mind, I will guide you next time for what you need to give me content`;

    // Save the generated context to the user document
    user.generatedBrandContext = gptSystemPrompt;
    
    this.logger.log(`GPT system prompt generated and saved for user: ${user._id}`);
    return gptSystemPrompt;
  }
} 