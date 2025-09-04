# Content Generator Backend System

A highly scalable, low-latency backend system built with NestJS for AI-powered content generation.

## 🚀 Features

- **High Performance**: Optimized MongoDB connections with connection pooling
- **Scalable Architecture**: Modular design following SOLID principles
- **AI Integration**: OpenAI GPT-4 integration for content generation
- **Comprehensive Logging**: Request tracing and error monitoring
- **Input Validation**: Robust DTOs with class-validator
- **Caching**: Redis-compatible caching for improved performance
- **Error Handling**: Global exception filters and timeout handling
- **API Documentation**: Swagger/OpenAPI documentation

## 🏗️ Architecture

### Database Collections

1. **users** - User profiles and preferences
2. **content_requests** - Raw input from clients with campaign details
3. **message_history** - AI interaction history for context
4. **generated_contents** - Final AI-generated outputs

### API Endpoints

- `POST /api/v1/content-requests` - Create content request and generate content
- `GET /api/v1/content-requests/:id` - Get specific content request
- `GET /api/v1/content-requests/user/:userId` - Get user's content requests (paginated)

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **AI Service**: OpenAI GPT-4
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Caching**: In-memory cache (Redis-compatible)
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API Key

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd project v1.0

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/content-generator

# Application Configuration
PORT=3000
NODE_ENV=development

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

Make sure MongoDB is running locally or provide a remote connection string.

### 4. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

API Documentation: `http://localhost:3000/api`

## 📖 API Usage

### Create Content Request

```bash
curl -X POST http://localhost:3000/api/v1/content-requests \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "channels": ["Facebook", "Instagram"],
    "name": "Summer Sale Campaign",
    "brandWork": "Eco-friendly skincare products",
    "areaOfFocus": "Sustainability",
    "location": "India",
    "language": "en",
    "tone": "casual",
    "productType": "beauty",
    "userPrompt": "Create engaging posts for our new organic face cream"
  }'
```

### Response Example

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "channels": ["Facebook", "Instagram"],
  "name": "Summer Sale Campaign",
  "brandWork": "Eco-friendly skincare products",
  "areaOfFocus": "Sustainability",
  "location": "India",
  "language": "en",
  "tone": "casual",
  "productType": "beauty",
  "status": "generated",
  "userPrompt": "Create engaging posts for our new organic face cream",
  "generatedContent": "🌿 Ready to glow naturally? Our new organic face cream is here!...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

## 🔧 Configuration

### Database Optimization

The system is configured with:
- Connection pooling (50 max, 5 min connections)
- Compression enabled
- Optimized timeouts
- Database indexes for performance

### Performance Features

- **Request Caching**: 5-minute TTL for GET requests
- **Connection Pooling**: Optimized MongoDB connections
- **Timeout Handling**: 60s default, 120s for AI requests
- **Request Tracing**: Unique IDs for debugging
- **Error Monitoring**: Comprehensive logging

## 🏛️ SOLID Design Principles

- **Single Responsibility**: Each service has one clear purpose
- **Open/Closed**: Extensible through interfaces and dependency injection
- **Liskov Substitution**: Services implement clear contracts
- **Interface Segregation**: Focused, specific interfaces
- **Dependency Inversion**: High-level modules depend on abstractions

## 📊 Monitoring & Logging

- Request/response logging with timing
- Error tracking with stack traces
- Performance metrics
- Request tracing with unique IDs

## 🔒 Security Features

- Input validation and sanitization
- Helmet.js security headers
- Rate limiting (configurable)
- Request timeout protection

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper logging aggregation
4. Configure reverse proxy (nginx)
5. Set up monitoring and alerting

## 📝 Development

```bash
# Run in development mode
npm run start:dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

1. Follow the established architecture patterns
2. Add tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Maintain SOLID design principles

## 📄 License

MIT License - feel free to use this project for your applications.

---

Built with ❤️ using NestJS and modern TypeScript practices.
