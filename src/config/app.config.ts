import { 
  API_CONSTANTS, 
  DATABASE_CONSTANTS, 
  AI_CONSTANTS
} from '../utils';

export default () => ({
  port: parseInt(process.env.PORT, 10) || API_CONSTANTS.DEFAULT_PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || DATABASE_CONSTANTS.DEFAULT_URI,
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || AI_CONSTANTS.OPENAI.DEFAULT_BASE_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
