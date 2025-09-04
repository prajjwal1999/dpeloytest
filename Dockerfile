# Vercel-ready & Render-ready Dockerfile for NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (includes package.json and package-lock.json if present)
COPY package*.json ./

# Install ALL dependencies (use npm ci if lockfile exists, otherwise npm install)
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build


# ---- Production image ----
FROM node:20-alpine

WORKDIR /app

# Copy only the built app and production node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose port (Render will respect this)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
