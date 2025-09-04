# Authentication System Setup

## Overview

This authentication system provides JWT-based authentication with the following features:

- User registration and login
- Password hashing with bcrypt
- JWT token generation (access + refresh tokens)
- Password reset functionality
- Role-based access control
- Protected routes with guards

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/content-creation-engine

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Application Configuration
NODE_ENV=development
PORT=3000

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Email Configuration (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Installation

1. Install the new dependencies:
```bash
npm install
```

2. Start the application:
```bash
npm run start:dev
```

## API Endpoints

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/profile` - Get current user profile
- `POST /auth/logout` - Logout user

### Protected Endpoints

All other endpoints now require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- `user` - Regular user (default)
- `premium_user` - Premium subscriber
- `enterprise` - Enterprise user
- `admin` - Administrator

## Route Protection

- **Public routes**: Authentication endpoints, user registration
- **User routes**: Users can only access/modify their own data
- **Admin routes**: Only admins can view all users, search by email, deactivate users

## Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

## Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "company": "Acme Corp"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Access protected endpoint
```bash
curl -X GET http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Security**: Separate secrets for access and refresh tokens
3. **Token Expiration**: Short-lived access tokens with refresh capability
4. **Role-based Access**: Different permission levels for different user types
5. **Input Validation**: All inputs are validated using class-validator
6. **Route Protection**: Global JWT guard with public route exceptions

## Database Changes

The User schema has been updated with the following new fields:

- `password` - Hashed password (not selected by default)
- `isEmailVerified` - Email verification status
- `emailVerificationToken` - Token for email verification
- `emailVerificationTokenExpires` - Expiration for email verification token
- `passwordResetToken` - Token for password reset
- `passwordResetTokenExpires` - Expiration for password reset token

## Next Steps

1. Set up email service for password reset functionality
2. Implement email verification
3. Add rate limiting for authentication endpoints
4. Set up refresh token rotation
5. Add login attempt tracking and account lockout
