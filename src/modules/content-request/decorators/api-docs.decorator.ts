import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { 
  CreateContentRequestDto, 
  ContentRequestResponseDto, 
  MultiChannelContentResponseDto 
} from '../dto';
import { HTTP_MESSAGES_EXTENDED } from '../../../utils';

export const ApiCreateContentRequest = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Create content request and generate content',
      description: 'Creates a new content request, generates content using AI, and saves to database'
    }),
    ApiBody({ 
      type: CreateContentRequestDto,
      description: 'Content request payload'
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Content request created and content generated successfully',
      type: ContentRequestResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'array', items: { type: 'string' } },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.BAD_REQUEST },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: HTTP_MESSAGES_EXTENDED.AI_GENERATION_FAILED },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.INTERNAL_SERVER_ERROR },
        },
      },
    })
  );

export const ApiCreateStructuredContentRequest = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Create structured content request for multiple channels',
      description: `Creates a new content request and generates structured content for each channel in the array.
      
      Word Limit Guidelines:
      • Instagram: Title 5-10 words, Body 50-100 words, CTA 2-5 words
      • Twitter: Title 3-8 words, Body 20-50 words, CTA 2-4 words  
      • Facebook: Title 5-15 words, Body 80-150 words, CTA 3-6 words
      • LinkedIn: Title 8-20 words, Body 100-200 words, CTA 4-8 words
      • Email: Title 8-15 words, Body 100-300 words, CTA 3-8 words
      
      Each channel will get its own optimized content format.`
    }),
    ApiBody({ 
      type: CreateContentRequestDto,
      description: 'Content request payload with multiple channels'
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Multi-channel structured content generated successfully',
      type: MultiChannelContentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'array', items: { type: 'string' } },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.BAD_REQUEST },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: HTTP_MESSAGES_EXTENDED.AI_GENERATION_FAILED },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.INTERNAL_SERVER_ERROR },
        },
      },
    })
  );

export const ApiGetContentRequest = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get content request by ID',
      description: 'Retrieves a specific content request with its generated content'
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Content request retrieved successfully',
      type: ContentRequestResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Content request not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: HTTP_MESSAGES_EXTENDED.NOT_FOUND },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.NOT_FOUND },
        },
      },
    })
  );

export const ApiGetMultiChannelContent = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get all channel content for a request',
      description: 'Retrieves all generated content for all channels from a specific content request'
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Multi-channel content retrieved successfully',
      type: MultiChannelContentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Content request not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: HTTP_MESSAGES_EXTENDED.NOT_FOUND },
          error: { type: 'string', example: HTTP_MESSAGES_EXTENDED.NOT_FOUND },
        },
      },
    })
  );
