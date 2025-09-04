# ---- Builder ----
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Copy package files
    COPY package*.json ./
    
    # Install dependencies
    RUN if [ -f package-lock.json ]; then \
          npm ci; \
        else \
          npm install; \
        fi && npm cache clean --force
    
    # Copy source code
    COPY . .
    
    # Build the application (produces /app/dist)
    RUN npm run build
    