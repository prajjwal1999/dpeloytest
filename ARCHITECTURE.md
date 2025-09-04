# Modular Architecture

This project follows a feature-based modular architecture for scalability and maintainability.

## Project Structure

```
src/
├── features/                    # Feature modules
│   ├── content-request/         # Content generation feature
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── content-request.module.ts
│   │   └── index.ts
│   ├── campaigns/               # Campaign management feature (empty)
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── campaigns.module.ts
│   │   └── index.ts
│   ├── _template/               # Template for new features
│   └── index.ts                 # Export all features
├── shared/                      # Shared utilities
│   ├── base/                    # Base classes
│   │   ├── base.controller.ts
│   │   ├── base.service.ts
│   │   ├── base.schema.ts
│   │   ├── base.dto.ts
│   │   └── index.ts
│   ├── constants/               # Application constants
│   ├── interfaces/              # TypeScript interfaces
│   ├── decorators/              # Custom decorators
│   ├── guards/                  # Authentication guards
│   ├── pipes/                   # Validation pipes
│   ├── filters/                 # Exception filters
│   ├── interceptors/            # Request/response interceptors
│   └── index.ts                 # Export all shared
├── config/                      # Configuration files
└── main.ts                      # Application entry point
```

## Adding New Features

### 1. Create Feature Structure
```bash
mkdir -p src/features/your-feature/{controllers,services,dto,schemas}
```

### 2. Create Module Files
- `your-feature.module.ts` - Module definition
- `index.ts` - Export all feature components
- `controllers/index.ts` - Export controllers
- `services/index.ts` - Export services
- `dto/index.ts` - Export DTOs
- `schemas/index.ts` - Export schemas

### 3. Register in App
- Add to `src/features/index.ts`
- Add to `src/app.module.ts`

## Benefits

✅ **Separation of Concerns** - Each feature is self-contained
✅ **Scalability** - Easy to add new features without affecting others
✅ **Maintainability** - Clear structure makes code easy to find and modify
✅ **Reusability** - Shared components can be used across features
✅ **Testing** - Features can be tested independently
✅ **Team Development** - Multiple developers can work on different features

## Best Practices

1. **Feature Independence** - Features should not directly import from other features
2. **Shared Dependencies** - Use shared utilities for common functionality
3. **Consistent Naming** - Follow the established naming conventions
4. **Base Classes** - Extend base classes for consistent patterns
5. **Proper Exports** - Only export what's needed by other modules
