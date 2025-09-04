// HTTP Messages
export const HTTP_MESSAGES = {
  INVALID_CONTENT_REQUEST_ID: 'Invalid content request ID',
  CONTENT_REQUEST_NOT_FOUND: 'Content request not found',
  INVALID_USER_ID: 'Invalid user ID',
  CONTENT_GENERATION_FAILED: 'Content generation failed',
  INVALID_REQUEST_DATA: 'Invalid request data',
} as const;

// Content Constants
export const CONTENT_CONSTANTS = {
  INITIAL_VERSION: 1,
  DEFAULT_PUBLISHED_STATE: false,
  MAX_RETRY_ATTEMPTS: 3,
  CONTENT_LENGTH_LIMIT: 5000,
} as const;

// Pagination Constants
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// AI Model Constants
export const AI_MODELS = {
  GPT_4: 'gpt-4',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  CLAUDE_3: 'claude-3',
} as const;

// Channel Types
export const CHANNEL_TYPES = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
} as const;

// Status Enums
export enum StatusEnum {
  PENDING = 'pending',
  GENERATED = 'generated',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

// Message Role Enums
export enum MessageRoleEnum {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

// Sample Data for API documentation
export const SAMPLE_DATA = {
  CONTENT_REQUEST_ID: '507f1f77bcf86cd799439011',
  USER_ID: '507f1f77bcf86cd799439012',
  GENERATED_CONTENT_ID: '507f1f77bcf86cd799439013',
  CHANNELS: ['Facebook', 'Instagram', 'Email'],
  CAMPAIGN_NAME: 'Summer Sale Campaign 2024',
  LOCATION: 'India',
  BRAND_DESCRIPTION: 'Eco-friendly skincare products for sustainable beauty',
  AREA_OF_FOCUS: 'Sustainability and Health',
  USER_PROMPT: 'Create engaging social media posts for our new organic face cream launch',
  TIMESTAMP: '2024-01-15T10:30:00.000Z',
} as const;

// Additional HTTP Messages
export const HTTP_MESSAGES_EXTENDED = {
  BAD_REQUEST: 'Bad Request',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NOT_FOUND: 'Not Found',
  AI_GENERATION_FAILED: 'AI content generation failed',
  REQUEST_TIMEOUT: 'Request timeout exceeded',
} as const;

// Database Configuration
export const DATABASE_CONSTANTS = {
  DEFAULT_URI: 'mongodb://localhost:27017/content-generator',
  CONNECTION_POOL: {
    MAX_POOL_SIZE: 50,
    MIN_POOL_SIZE: 5,
    MAX_IDLE_TIME_MS: 30000,
    SERVER_SELECTION_TIMEOUT_MS: 5000,
    SOCKET_TIMEOUT_MS: 45000,
  },
  COMPRESSOR: 'zlib',
} as const;

// Collection Names
export const COLLECTION_NAMES = {
  CONTENT_REQUESTS: 'content_requests',
  GENERATED_CONTENTS: 'generated_contents',
  MESSAGE_HISTORY: 'message_history',
  USERS: 'users',
  SOCIAL_MEDIA_COLLECTIONS: 'social_media_collections',
} as const;

// API Configuration
export const API_CONSTANTS = {
  VERSION: '1.0',
  PREFIX: 'api/v1',
  SWAGGER_PATH: 'api',
  DEFAULT_PORT: 3000,
} as const;

// AI Service Configuration
export const AI_CONSTANTS = {
  OPENAI: {
    DEFAULT_BASE_URL: 'https://api.openai.com/v1',
    TIMEOUT_MS: 30000,
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.1,
    PRESENCE_PENALTY: 0.1,
  },
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    TIMEOUT_MS: 30000,
    DEFAULT_MODEL: 'gemini-2.0-flash',
  },
} as const;

// Timeout Configuration
export const TIMEOUT_CONSTANTS = {
  DEFAULT_REQUEST_MS: 60000, // 60 seconds
  AI_REQUEST_MS: 120000, // 2 minutes for AI requests
} as const;

// Request ID Generation Constants
export const REQUEST_ID_CONSTANTS = {
  TIMESTAMP_MULTIPLIER: 1,
  RANDOM_STRING_LENGTH: 9,
  RANDOM_STRING_BASE: 36,
  RANDOM_STRING_START_INDEX: 2,
} as const;

// AI Provider and Model Enums
export enum AIProviderEnum {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export enum AIModelEnum {
  // OpenAI Models
  GPT_4O = 'gpt-4o',
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  GPT_4 = 'gpt-4',
  GPT_35_TURBO = 'gpt-3.5-turbo',
  
  // Gemini Models
  GEMINI_PRO = 'gemini-pro',
  GEMINI_PRO_VISION = 'gemini-pro-vision',
}

// Additional Enums
export enum ToneEnum {
  FORMAL = 'formal',
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
  PLAYFUL = 'playful',
  GEN_Z = 'gen-z',
  MILLENNIAL = 'millennial',
}

export enum ProductTypeEnum {
  CLOTHES = 'clothes',
  BEAUTY = 'beauty',
  MEDICINE = 'medicine',
  SUPPLEMENTS = 'supplements',
}

export enum LanguageEnum {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  HINDI = 'hindi',
}

// Interface for User Content Requests Response
export interface UserContentRequestsResponse {
  readonly requests: any[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
}

// Channel Types
export enum ChannelEnum {
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram',
  TWITTER = 'Twitter',
  LINKEDIN = 'LinkedIn',
  EMAIL = 'Email',
  WEBSITE = 'Website',
}

// Validation Constants
export const VALIDATION_CONSTANTS = {
  CONTENT_REQUEST: {
    NAME_MAX_LENGTH: 200,
    BRAND_WORK_MAX_LENGTH: 500,
    AREA_OF_FOCUS_MAX_LENGTH: 200,
    LOCATION_MAX_LENGTH: 100,
    USER_PROMPT_MIN_LENGTH: 10,
    USER_PROMPT_MAX_LENGTH: 1000,
    MIN_CHANNELS: 1,
  },
} as const;
