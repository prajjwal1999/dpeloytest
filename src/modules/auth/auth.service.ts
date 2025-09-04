import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../../entities/user.schema';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto';
import { ToneEnum, ChannelEnum, ProductTypeEnum, LanguageEnum } from '../../utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user: ${registerDto.email}`);

    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        email: registerDto.email,
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user with default preferences
      const user = new this.userModel({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        phone: registerDto.phone,
        company: registerDto.company,
        jobTitle: registerDto.jobTitle,
        role: 'user',
        preferences: {
          defaultTone: ToneEnum.CASUAL,
          defaultLanguage: LanguageEnum.EN,
          preferredChannels: [ChannelEnum.INSTAGRAM, ChannelEnum.FACEBOOK],
          defaultProductType: ProductTypeEnum.BEAUTY,
        },
        context: {},
        isOnboarded: false,
        isActive: true,
        isEmailVerified: false, // Will be true after email verification
        totalContentRequests: 0,
        subscriptionTier: 'free',
        usageAnalytics: {
          mostUsedTones: [],
          mostUsedChannels: [],
          mostUsedProductTypes: [],
          averageContentLength: 0,
          preferredAIModel: 'gpt-4o',
        },
      });

      const savedUser = await user.save();

      // Generate brand context
      this.generateSimpleBrandContext(savedUser);
      await savedUser.save();

      this.logger.log(`User registered successfully: ${savedUser._id}`);

      // Generate tokens
      const tokens = this.generateTokens(savedUser);

      return {
        ...tokens,
        user: {
          _id: savedUser._id.toString(),
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          isEmailVerified: savedUser.isEmailVerified,
          subscriptionTier: savedUser.subscriptionTier,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to register user: ${error.message}`);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    try {
      // Find user with password
      const user = await this.userModel
        .findOne({ email: loginDto.email })
        .select('+password');

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      this.logger.log(`User logged in successfully: ${user._id}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          subscriptionTier: user.subscriptionTier,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to login user: ${error.message}`);
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    this.logger.log(`Password reset requested for: ${forgotPasswordDto.email}`);

    try {
      const user = await this.userModel.findOne({ email: forgotPasswordDto.email });

      if (!user) {
        // Don't reveal if email exists or not
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetTokenExpires = resetTokenExpires;
      await user.save();

      // TODO: Send email with reset token
      // For now, we'll just log it (in production, integrate with email service)
      this.logger.log(`Password reset token for ${user.email}: ${resetToken}`);

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      this.logger.error(`Failed to process forgot password: ${error.message}`);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    this.logger.log(`Password reset attempt with token: ${resetPasswordDto.token}`);

    try {
      const user = await this.userModel.findOne({
        passwordResetToken: resetPasswordDto.token,
        passwordResetTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();

      this.logger.log(`Password reset successful for user: ${user._id}`);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      this.logger.error(`Failed to reset password: ${error.message}`);
      throw error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.log(`Password change request for user: ${userId}`);

    try {
      const user = await this.userModel.findById(userId).select('+password');

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

      user.password = hashedPassword;
      await user.save();

      this.logger.log(`Password changed successfully for user: ${userId}`);

      return { message: 'Password has been changed successfully' };
    } catch (error) {
      this.logger.error(`Failed to change password: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.userModel.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: user._id,
          email: user.email,
          role: user.role,
        },
        {
          secret: process.env.JWT_SECRET || 'secret',
          expiresIn: '15m',
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  private generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateSimpleBrandContext(user: UserDocument): string {
    const brandName = user.company || user.name;
    const brandDescription = `${user.name}${user.company ? ` from ${user.company}` : ''}${
      user.jobTitle ? `, ${user.jobTitle}` : ''
    } - A ${user.preferences.defaultProductType} business.`;

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

  async googleLogin(googleUser: any): Promise<AuthResponseDto> {
    this.logger.log(`Google login attempt for user: ${googleUser.email}`);

    try {
      // Check if user already exists
      let user = await this.userModel.findOne({
        $or: [
          { email: googleUser.email },
          { googleId: googleUser.googleId }
        ]
      });

      if (user) {
        // Update existing user with Google info if not already set
        if (!user.googleId) {
          user.googleId = googleUser.googleId;
          user.picture = googleUser.picture;
          await user.save();
        }
        
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        this.logger.log(`Existing user logged in via Google: ${user._id}`);
      } else {
        // Create new user from Google profile
        user = new this.userModel({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          picture: googleUser.picture,
          role: 'user',
          isEmailVerified: true, // Google emails are already verified
          preferences: {
            defaultTone: ToneEnum.CASUAL,
            defaultLanguage: LanguageEnum.EN,
            preferredChannels: [ChannelEnum.INSTAGRAM, ChannelEnum.FACEBOOK],
            defaultProductType: ProductTypeEnum.BEAUTY,
          },
          context: {},
          isOnboarded: false,
          isActive: true,
          lastLoginAt: new Date(),
          totalContentRequests: 0,
          subscriptionTier: 'free',
          usageAnalytics: {
            mostUsedTones: [],
            mostUsedChannels: [],
            mostUsedProductTypes: [],
            averageContentLength: 0,
            preferredAIModel: 'gpt-4o',
          },
        });

        const savedUser = await user.save();

        // Generate brand context for new user
        this.generateSimpleBrandContext(savedUser);
        await savedUser.save();

        this.logger.log(`New user created via Google: ${savedUser._id}`);
        user = savedUser;
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          subscriptionTier: user.subscriptionTier,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to authenticate Google user: ${error.message}`);
      throw error;
    }
  }
}
