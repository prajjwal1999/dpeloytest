# Project Structure

This project follows a modular architecture pattern for better organization and scalability.

## Directory Structure

```
src/
│
├── main.ts                # Entry point
├── app.module.ts          # Root module
│
├── common/                # Shared utilities, guards, pipes, interceptors
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
├── config/                # Configurations (DB, env, etc.)
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── config.module.ts
│
├── database/              # TypeORM/Mongoose entities or Prisma models
│   ├── entities/
│   ├── migrations/
│   └── database.module.ts
│
├── modules/               # Feature-based modules
│   ├── users/
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── users.repository.ts (if using custom repos)
│   │
│   ├── auth/
│   │   ├── dto/
│   │   ├── strategies/    # JWT, Local, etc.
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── products/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   │
│   ├── orders/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── orders.module.ts
│   │
│   └── payments/
│       ├── dto/
│       ├── entities/
│       ├── payments.controller.ts
│       ├── payments.service.ts
│       └── payments.module.ts
│
├── shared/                # Reusable utilities
│   ├── filters/          # Exception filters
│   └── interceptors/     # Request/response interceptors
│
└── utils/                 # Utility functions
    ├── constants.ts
    └── helpers.ts
```

## Current Implementation

### Content Request Module
- **Location**: `src/modules/content-request/`
- **Components**:
  - `content-request.controller.ts` - API endpoints
  - `content-request.service.ts` - Business logic
  - `content-request.module.ts` - Module configuration
  - `ai.service.ts` - AI integration service
  - `dto/` - Data Transfer Objects
  - `entities/` - Database schemas/models

### Database Module
- **Location**: `src/database/`
- **Components**:
  - `database.module.ts` - Database configuration
  - `entities/` - Database entities/schemas

### Configuration Module
- **Location**: `src/config/`
- **Components**:
  - `config.module.ts` - Application configuration
  - `app.config.ts` - App-specific config
  - `database.config.ts` - Database config

### Shared Utilities
- **Location**: `src/shared/`
- **Components**:
  - `filters/` - Exception filters
  - `interceptors/` - Request/response interceptors

### Utils
- **Location**: `src/utils/`
- **Components**:
  - `constants.ts` - Application constants
  - `helpers.ts` - Utility functions
  - `enums/` - TypeScript enums
  - `interfaces/` - TypeScript interfaces

## Benefits of This Structure

1. **Modularity**: Each feature is self-contained
2. **Scalability**: Easy to add new modules
3. **Maintainability**: Clear separation of concerns
4. **Reusability**: Shared utilities can be used across modules
5. **Testability**: Each module can be tested independently

## Adding New Modules

To add a new module (e.g., `users`):

1. Create directory: `src/modules/users/`
2. Add module files:
   - `users.module.ts`
   - `users.controller.ts`
   - `users.service.ts`
   - `dto/` directory for DTOs
   - `entities/` directory for database models
3. Import the module in `src/modules/index.ts`
4. Add the module to `app.module.ts`

## Best Practices

1. Keep modules focused on a single feature
2. Use consistent naming conventions
3. Export only what's necessary from modules
4. Use dependency injection for services
5. Implement proper error handling
6. Add comprehensive documentation
