# Vercel-ready Dockerfile for NestJS application
FROM node:18-alpine

WORKDIR /app

# Update npm to latest version to support lockfileVersion 3
RUN npm install -g npm@latest

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
