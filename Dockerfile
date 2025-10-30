# Multi-stage Dockerfile for ZIKADA 3886 Website
# Optimized for production deployment with Dokploy

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Copy static assets to public/ so Vite includes them in build
# Vite automatically copies everything from public/ to dist/ during build
# This ensures animations, lotties, and videos are included in the production build
RUN if [ -d "animations" ]; then mkdir -p public && cp -r animations public/; fi && \
    if [ -d "lotties" ]; then mkdir -p public && cp -r lotties public/; fi && \
    if [ -d "videos" ]; then mkdir -p public && cp -r videos public/; fi && \
    echo "✅ Static assets copied to public/ for Vite build"

# Build the application
RUN npm run build && \
    echo "📦 Build completed. Verifying assets..." && \
    ls -la dist/animations/lottie/ 2>/dev/null | head -5 || echo "⚠️ animations/lottie not found" && \
    ls -la dist/lotties/ 2>/dev/null | head -3 || echo "⚠️ lotties not found" && \
    ls -la dist/videos/ 2>/dev/null | head -3 || echo "⚠️ videos not found" && \
    echo "✅ Asset verification complete"

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install http-server globally
RUN npm install -g http-server

# Create non-root user
RUN addgroup -g 1000 -S nodejs && \
    adduser -S zikada -u 1000 -G nodejs

# Copy built application from builder stage (includes assets from public/)
COPY --from=builder --chown=zikada:nodejs /app/dist ./dist

# Copy package.json for version info
COPY --from=builder --chown=zikada:nodejs /app/package.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R zikada:nodejs /app/logs

# Switch to non-root user
USER zikada

# Expose port
EXPOSE 3886

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3886/ || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3886
ENV HOST=0.0.0.0

# Start the application
CMD ["http-server", "dist", "-p", "3886", "-a", "0.0.0.0", "--cors", "--gzip", "--brotli", "--cache", "31536000"]
