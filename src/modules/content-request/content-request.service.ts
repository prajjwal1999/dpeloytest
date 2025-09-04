import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { 
  ContentRequest, 
  ContentRequestDocument, 
  GeneratedContent, 
  GeneratedContentDocument,
  MessageHistory,
  MessageHistoryDocument,
  User,
  UserDocument
} from '../../entities';
import { CreateContentRequestDto, ContentRequestResponseDto, GeneratedContentResponseDto, MultiChannelContentResponseDto } from './dto';
import { 
  StatusEnum, 
  MessageRoleEnum, 
  HTTP_MESSAGES, 
  CONTENT_CONSTANTS,
  PAGINATION_CONSTANTS,
  UserContentRequestsResponse,
  ChannelEnum
} from '../../utils';
import { AIService, AIPromptRequest } from './ai.service';
import { SocialMediaCollectionService } from './social-media-collection.service';

@Injectable()
export class ContentRequestService {
  private readonly logger = new Logger(ContentRequestService.name);

  constructor(
    @InjectModel(ContentRequest.name)
    private readonly contentRequestModel: Model<ContentRequestDocument>,
    @InjectModel(GeneratedContent.name)
    private readonly generatedContentModel: Model<GeneratedContentDocument>,
    @InjectModel(MessageHistory.name)
    private readonly messageHistoryModel: Model<MessageHistoryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly aiService: AIService,
    private readonly socialMediaCollectionService: SocialMediaCollectionService,
  ) {}

  async createStructuredContentRequest(
    createContentRequestDto: CreateContentRequestDto,
  ): Promise<MultiChannelContentResponseDto> {
    const session = await this.contentRequestModel.db.startSession();
    let transactionCommitted = false;
    
    try {
      session.startTransaction();
      this.logger.log(`Creating structured content request for user: ${createContentRequestDto.userId}`);

      // Get user context and history
      const user = await this.userModel.findById(createContentRequestDto.userId).lean();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get user's previous content for context
      const previousContent = await this.socialMediaCollectionService.getLastNGeneratedContents(
        createContentRequestDto.userId,
        10
      );

      // Create the content request
      const contentRequest = new this.contentRequestModel({
        ...createContentRequestDto,
        status: StatusEnum.PENDING,
      });

      const savedRequest = await contentRequest.save({ session });
      this.logger.log(`Content request created with ID: ${savedRequest._id}`);

      // Prepare AI request with enhanced context
      const aiRequest: AIPromptRequest = {
        channels: createContentRequestDto.channels,
        productName: createContentRequestDto.productName,
        keyBenefits: createContentRequestDto.keyBenefits,
        targetAudience: createContentRequestDto.targetAudience,
        tone: createContentRequestDto.tone,
        userBrandContext: user.generatedBrandContext,
        previousContent: previousContent,
      };

      // Generate structured content using AI service
      this.logger.log('Calling AI service for structured content generation');
      const structuredResponses = await this.aiService.generateMultiChannelStructuredContent(
        aiRequest, 
        savedRequest._id.toString()
      );

      // Save message history
      await this.saveMessageHistory(
        savedRequest._id as Types.ObjectId,
        `Product: ${createContentRequestDto.productName}, Target: ${createContentRequestDto.targetAudience}`,
        JSON.stringify(aiRequest),
        JSON.stringify(structuredResponses),
        session,
      );

      // Save generated content for each channel
      const savedGeneratedContents = [];
      for (const structuredResponse of structuredResponses) {
        const generatedContent = new this.generatedContentModel({
          requestId: savedRequest._id,
          userId: createContentRequestDto.userId,
          generatedText: JSON.stringify(structuredResponse),
          metadata: {
            structuredContent: structuredResponse,
            contentType: structuredResponse.contentType,
            channel: structuredResponse.content.channel,
            model: structuredResponse.model
          },
          channel: structuredResponse.content.channel,
          version: CONTENT_CONSTANTS.INITIAL_VERSION,
          isPublished: CONTENT_CONSTANTS.DEFAULT_PUBLISHED_STATE,
        });

        await generatedContent.save({ session });
        savedGeneratedContents.push(generatedContent);

        // Save to social media collection for future context
        await this.socialMediaCollectionService.saveContentToCollection(
          createContentRequestDto.userId,
          structuredResponse.content.channel as ChannelEnum,
          createContentRequestDto.productName,
          createContentRequestDto.keyBenefits,
          structuredResponse.content.tone,
          {
            title: structuredResponse.content.title,
            body: structuredResponse.content.body,
            cta: structuredResponse.content.cta,
            hashtags: structuredResponse.content.meta.hashtags,
            emojis: structuredResponse.content.meta.emojis,
          },
          savedRequest._id as Types.ObjectId,
          structuredResponse.model,
          {
            requestId: savedRequest._id.toString(),
            contentType: structuredResponse.contentType,
          }
        );
      }

      // Archive old content to keep collections manageable
      await this.socialMediaCollectionService.archiveOldContent(
        createContentRequestDto.userId,
        50
      );

      // Update request status to generated
      savedRequest.status = StatusEnum.GENERATED;
      await savedRequest.save({ session });

      await session.commitTransaction();
      transactionCommitted = true;
      this.logger.log(`Structured content successfully generated for ${structuredResponses.length} channels for request: ${savedRequest._id}`);

      // Convert structured responses to GeneratedContentResponseDto format
      const channelContents: GeneratedContentResponseDto[] = structuredResponses.map((response, index) => ({
        _id: savedGeneratedContents[index]._id as Types.ObjectId,
        requestId: savedRequest._id as Types.ObjectId,
        model: response.model,
        contentType: response.contentType,
        content: {
          channel: response.content.channel,
          language: response.content.language,
          tone: response.content.tone,
          title: response.content.title,
          body: response.content.body,
          cta: response.content.cta,
          meta: {
            hashtags: response.content.meta.hashtags,
            emojis: response.content.meta.emojis
          }
        },
        status: response.status,
        createdAt: response.createdAt
      }));
      
      return {
        requestId: savedRequest._id as Types.ObjectId,
        model: structuredResponses[0]?.model || 'unknown',
        channelContents: channelContents,
        totalChannels: channelContents.length,
        createdAt: structuredResponses[0]?.createdAt || new Date()
      };

    } catch (error) {
      if (!transactionCommitted) {
        await session.abortTransaction();
      }
      this.logger.error(`Failed to create structured content request: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getContentRequest(id: string): Promise<ContentRequestResponseDto> {
    this.logger.log(`Fetching content request: ${id}`);
    
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(HTTP_MESSAGES.INVALID_CONTENT_REQUEST_ID);
    }

    const contentRequest = await this.contentRequestModel
      .findById(id)
      .lean()
      .exec();

    if (!contentRequest) {
      throw new NotFoundException(HTTP_MESSAGES.CONTENT_REQUEST_NOT_FOUND);
    }

    // Get the latest generated content
    const generatedContent = await this.generatedContentModel
      .findOne({ requestId: contentRequest._id })
      .sort({ version: -1 })
      .lean()
      .exec();

    return {
      _id: contentRequest._id as Types.ObjectId,
      userId: contentRequest.userId,
      productName: contentRequest.productName,
      keyBenefits: contentRequest.keyBenefits,
      targetAudience: contentRequest.targetAudience,
      tone: contentRequest.tone,
      channels: contentRequest.channels,
      status: contentRequest.status,
      generatedContent: generatedContent?.generatedText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getUserContentRequests(
    userId: string,
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  ): Promise<UserContentRequestsResponse> {
    this.logger.log(`Fetching content requests for user: ${userId}, page: ${page}`);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(HTTP_MESSAGES.INVALID_USER_ID);
    }

    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      this.contentRequestModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.contentRequestModel.countDocuments({ userId }),
    ]);

    // Get generated content for each request
    const requestsWithContent = await Promise.all(
      requests.map(async (request) => {
        const generatedContent = await this.generatedContentModel
          .findOne({ requestId: request._id })
          .sort({ version: -1 })
          .lean()
          .exec();

        return {
          _id: request._id as Types.ObjectId,
          userId: request.userId,
          productName: request.productName,
          keyBenefits: request.keyBenefits,
          targetAudience: request.targetAudience,
          tone: request.tone,
          channels: request.channels,
          status: request.status,
          generatedContent: generatedContent?.generatedText,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    );

    return {
      requests: requestsWithContent,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async saveMessageHistory(
    requestId: Types.ObjectId,
    userMessage: string,
    prompt: string,
    response: string,
    session: ClientSession,
  ): Promise<void> {
    const messageHistory = new this.messageHistoryModel({
      requestId,
      role: MessageRoleEnum.USER,
      message: userMessage,
      prompt,
      response,
      timestamp: new Date(),
    });

    await messageHistory.save({ session });
    this.logger.debug(`Message history saved for request: ${requestId}`);
  }

  async getMultiChannelContent(requestId: string): Promise<MultiChannelContentResponseDto> {
    this.logger.log(`Fetching multi-channel content for request: ${requestId}`);
    
    if (!Types.ObjectId.isValid(requestId)) {
      throw new NotFoundException(HTTP_MESSAGES.INVALID_CONTENT_REQUEST_ID);
    }

    // Get all generated content for this request
    const generatedContents = await this.generatedContentModel
      .find({ requestId: new Types.ObjectId(requestId) })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    if (!generatedContents || generatedContents.length === 0) {
      throw new NotFoundException('No generated content found for this request');
    }

    // Parse the structured content from each generated content
    const channelContents: GeneratedContentResponseDto[] = [];
    
    for (const content of generatedContents) {
      try {
        const structuredContent = JSON.parse(content.generatedText);
        channelContents.push({
          _id: content._id as Types.ObjectId,
          requestId: content.requestId as Types.ObjectId,
          model: structuredContent.model || 'unknown',
          contentType: structuredContent.contentType || 'ad_copy',
          content: {
            channel: structuredContent.content?.channel || content.channel,
            language: structuredContent.content?.language || 'en',
            tone: structuredContent.content?.tone || 'casual',
            title: structuredContent.content?.title || '',
            body: structuredContent.content?.body || '',
            cta: structuredContent.content?.cta || '',
            meta: {
              hashtags: structuredContent.content?.meta?.hashtags || [],
              emojis: structuredContent.content?.meta?.emojis || []
            }
          },
          status: structuredContent.status || 'draft',
          createdAt: structuredContent.createdAt ? new Date(structuredContent.createdAt) : new Date()
        });
      } catch (error) {
        this.logger.warn(`Failed to parse structured content for ${content.channel}: ${error.message}`);
        // Create a fallback response
        channelContents.push({
          _id: content._id as Types.ObjectId,
          requestId: content.requestId as Types.ObjectId,
          model: 'unknown',
          contentType: 'ad_copy',
          content: {
            channel: content.channel,
            language: 'en',
            tone: 'casual',
            title: 'Generated Content',
            body: content.generatedText,
            cta: 'Learn More',
            meta: {
              hashtags: [],
              emojis: []
            }
          },
          status: 'draft',
          createdAt: new Date()
        });
      }
    }

    return {
      requestId: new Types.ObjectId(requestId),
      model: channelContents[0]?.model || 'unknown',
      channelContents: channelContents,
      totalChannels: channelContents.length,
      createdAt: channelContents[0]?.createdAt || new Date()
    };
  }

  async getUserContentHistory(
    userId: string,
    channel?: ChannelEnum,
    limit: number = 10,
  ) {
    this.logger.log(`Fetching content history for user: ${userId}, channel: ${channel}`);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(HTTP_MESSAGES.INVALID_USER_ID);
    }

    return this.socialMediaCollectionService.getUserContentHistory(
      new Types.ObjectId(userId),
      channel,
      limit,
    );
  }
}
