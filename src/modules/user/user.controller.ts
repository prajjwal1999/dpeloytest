import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserProfileDto,
  UserPreferencesDto,
} from './dto';
import { PAGINATION_CONSTANTS } from '../../utils';

@ApiTags('User Management')
@Controller('users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin') // Only admin can create users directly (registration should go through /auth/register)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating new user: ${createUserDto.email}`);
    
    const startTime = Date.now();
    try {
      const result = await this.userService.createUser(createUserDto);
      
      const duration = Date.now() - startTime;
      this.logger.log(`User created successfully in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to create user after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Roles('admin') // Only admin can view all users
  @UseInterceptors(CacheInterceptor)
  async getAllUsers(
    @Query('page') page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    @Query('limit') limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  ) {
    this.logger.log(`Fetching users - page: ${page}, limit: ${limit}`);
    
    const validatedPage = Math.max(PAGINATION_CONSTANTS.DEFAULT_PAGE, page);
    const validatedLimit = Math.min(
      PAGINATION_CONSTANTS.MAX_LIMIT, 
      Math.max(PAGINATION_CONSTANTS.DEFAULT_PAGE, limit)
    );
    
    return this.userService.getAllUsers(validatedPage, validatedLimit);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  async getUserById(@Param('id') id: string, @Request() req): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${id}`);
    // Users can only access their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new Error('Access denied');
    }
    return this.userService.getUserById(id);
  }

  @Get('email/:email')
  @Roles('admin') // Only admin can search by email
  @UseInterceptors(CacheInterceptor)
  async getUserByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by email: ${email}`);
    return this.userService.getUserByEmail(email);
  }

  @Get(':id/profile')
  @UseInterceptors(CacheInterceptor)
  async getUserProfile(@Param('id') id: string, @Request() req): Promise<UserProfileDto> {
    this.logger.log(`Fetching user profile: ${id}`);
    // Users can only access their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new Error('Access denied');
    }
    return this.userService.getUserProfile(id);
  }


  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id}`);
    // Users can only update their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new Error('Access denied');
    }
    return this.userService.updateUser(id, updateUserDto);
  }

  @Patch(':id/preferences')
  async updateUserPreferences(
    @Param('id') id: string,
    @Body() preferences: Partial<UserPreferencesDto>,
    @Request() req
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating preferences for user: ${id}`);
    // Users can only update their own preferences unless they're admin
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new Error('Access denied');
    }
    return this.userService.updateUserPreferences(id, preferences);
  }

  @Delete(':id')
  @Roles('admin') // Only admin can deactivate users
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${id}`);
    return this.userService.deactivateUser(id);
  }
} 