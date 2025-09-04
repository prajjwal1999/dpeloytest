import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ContentRequestService } from './content-request.service';
import { CreateContentRequestDto, ContentRequestResponseDto, MultiChannelContentResponseDto } from './dto';
import { 
  PAGINATION_CONSTANTS,
  UserContentRequestsResponse 
} from '../../utils';
import { 
  ApiCreateContentRequest, 
  ApiCreateStructuredContentRequest, 
  ApiGetContentRequest, 
  ApiGetMultiChannelContent 
} from './decorators/api-docs.decorator';

@ApiTags('Content Generation')
@Controller('content-requests')
export class ContentRequestController {
  private readonly logger = new Logger(ContentRequestController.name);

  constructor(
    private readonly contentRequestService: ContentRequestService,
  ) {}


  @Post('structured')
  async createContentRequest(
    @Body() createContentRequestDto: CreateContentRequestDto,
  ): Promise<MultiChannelContentResponseDto> {
    this.logger.log(`Creating structured content request for user: ${createContentRequestDto.userId}`);
    
    const startTime = Date.now();
    try {
      const result = await this.contentRequestService.createStructuredContentRequest(
        createContentRequestDto,
      );
      
      const duration = Date.now() - startTime;
      this.logger.log(`Structured content request created successfully in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to create structured content request after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Post('generate-multiple')
  async generateMultipleVariations(
    @Body() createContentRequestDto: CreateContentRequestDto,
  ): Promise<MultiChannelContentResponseDto[]> {
    this.logger.log(`Generating multiple content variations for user: ${createContentRequestDto.userId}`);
    
    const startTime = Date.now();
    try {
      // Generate 2-3 variations by calling the structured content endpoint multiple times
      const variations = [];
      const numberOfVariations = Math.min(createContentRequestDto.channels.length, 3);
      
      for (let i = 0; i < numberOfVariations; i++) {
        const result = await this.contentRequestService.createStructuredContentRequest(
          createContentRequestDto,
        );
        variations.push(result);
      }
      
      const duration = Date.now() - startTime;
      this.logger.log(`${variations.length} content variations generated successfully in ${duration}ms`);
      
      return variations;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to generate multiple variations after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Get('multi-channel/:requestId')
  async getMultiChannelContent(
    @Param('requestId') requestId: string,
  ): Promise<MultiChannelContentResponseDto> {
    this.logger.log(`Fetching multi-channel content for request: ${requestId}`);
    
    const startTime = Date.now();
    try {
      const result = await this.contentRequestService.getMultiChannelContent(requestId);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Multi-channel content retrieved successfully in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to retrieve multi-channel content after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async getContentRequest(
    @Param('id') id: string,
  ): Promise<ContentRequestResponseDto> {
    this.logger.log(`Fetching content request: ${id}`);
    return this.contentRequestService.getContentRequest(id);
  }

  @Get('user/:userId')
  async getUserContentRequests(
    @Param('userId') userId: string,
    @Query('page') page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    @Query('limit') limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  ): Promise<UserContentRequestsResponse> {
    this.logger.log(`Fetching content requests for user: ${userId}, page: ${page}`);
    
    // Validate and sanitize pagination parameters
    const validatedPage = Math.max(PAGINATION_CONSTANTS.DEFAULT_PAGE, page);
    const validatedLimit = Math.min(
      PAGINATION_CONSTANTS.MAX_LIMIT, 
      Math.max(PAGINATION_CONSTANTS.DEFAULT_PAGE, limit)
    );
    
    return this.contentRequestService.getUserContentRequests(
      userId,
      validatedPage,
      validatedLimit,
    );
  }

  @Get('user/:userId/history')
  async getUserContentHistory(
    @Param('userId') userId: string,
    @Query('channel') channel?: string,
    @Query('limit') limit: number = 10,
  ) {
    this.logger.log(`Fetching content history for user: ${userId}, channel: ${channel}`);
    
    return this.contentRequestService.getUserContentHistory(
      userId,
      channel as any,
      limit,
    );
  }
}
