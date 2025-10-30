#!/bin/bash
# Deployment script for ZIKADA 3886 Website
# Prepares the application for Dokploy deployment

set -e

echo "🚀 Starting ZIKADA 3886 deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check npm version
print_status "Checking npm version..."
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production
print_success "Dependencies installed"

# Run tests
print_status "Running tests..."
if npm run test:e2e; then
    print_success "Tests passed"
else
    print_warning "Some tests failed, but continuing with deployment"
fi

# Build the application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Verify build output
print_status "Verifying build output..."
if [ ! -d "dist" ]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    print_error "dist/index.html not found"
    exit 1
fi

if [ ! -f "dist/control-panel.html" ]; then
    print_error "dist/control-panel.html not found"
    exit 1
fi

print_success "Build output verified"

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p deployment
print_success "Deployment directory created"

# Copy necessary files
print_status "Copying deployment files..."
cp -r dist/* deployment/
cp dokploy.yml deployment/
cp nginx.conf deployment/
cp Dockerfile deployment/
print_success "Deployment files copied"

# Create monitoring directory
print_status "Setting up monitoring..."
mkdir -p deployment/monitoring
mkdir -p deployment/logs
mkdir -p deployment/ssl

# Create Prometheus configuration
cat > deployment/monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'zikada-3886'
    static_configs:
      - targets: ['zikada-3886:3886']
    metrics_path: /metrics
    scrape_interval: 30s
EOF

# Create Grafana datasource configuration
mkdir -p deployment/monitoring/grafana/datasources
cat > deployment/monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Create Grafana dashboard configuration
mkdir -p deployment/monitoring/grafana/dashboards
cat > deployment/monitoring/grafana/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# Create a simple dashboard
cat > deployment/monitoring/grafana/dashboards/zikada-3886.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "ZIKADA 3886 Performance",
    "tags": ["zikada", "performance"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "nginx_http_request_duration_seconds",
            "legendFormat": "Response Time"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

print_success "Monitoring configuration created"

# Create deployment README
cat > deployment/README.md << EOF
# ZIKADA 3886 Website - Deployment Package

This package contains everything needed to deploy the ZIKADA 3886 website using Dokploy.

## Contents

- \`dist/\` - Built application files
- \`dokploy.yml\` - Docker Compose configuration for Dokploy
- \`nginx.conf\` - Nginx configuration for reverse proxy
- \`Dockerfile\` - Docker image definition
- \`monitoring/\` - Prometheus and Grafana configuration

## Deployment Instructions

1. Upload this entire directory to your Dokploy server
2. In Dokploy, create a new project
3. Use the \`dokploy.yml\` file as your Docker Compose configuration
4. Deploy the project

## Services

- **zikada-3886**: Main application (port 3886)
- **nginx**: Reverse proxy (ports 80, 443)
- **prometheus**: Metrics collection (port 9090)
- **grafana**: Monitoring dashboard (port 3000)

## Health Checks

- Application: http://your-domain/health
- Metrics: http://your-domain/metrics
- Grafana: http://your-domain:3000 (admin/admin)

## Environment Variables

- \`NODE_ENV=production\`
- \`PORT=3886\`
- \`HOST=0.0.0.0\`
- \`VITE_APP_VERSION\` - Git commit SHA
- \`VITE_BUILD_TIME\` - Build timestamp

## Monitoring

The deployment includes Prometheus and Grafana for monitoring:
- Prometheus collects metrics from the application
- Grafana provides dashboards for visualization
- Default credentials: admin/admin

## SSL/TLS

To enable HTTPS:
1. Place your SSL certificates in the \`ssl/\` directory
2. Update the \`nginx.conf\` file with your domain name
3. Restart the nginx service

## Logs

Application logs are stored in the \`logs/\` directory:
- Application logs: \`logs/app/\`
- Nginx logs: \`logs/nginx/\`

## Performance

The deployment is optimized for production:
- Gzip and Brotli compression enabled
- Long-term caching for static assets
- Rate limiting configured
- Security headers included
- Resource limits set

## Troubleshooting

1. Check container logs: \`docker logs zikada-3886-website\`
2. Check nginx logs: \`docker logs zikada-3886-nginx\`
3. Verify health endpoint: \`curl http://your-domain/health\`
4. Check metrics: \`curl http://your-domain/metrics\`

## Support

For issues or questions, refer to the main project documentation.
EOF

print_success "Deployment README created"

# Create .dockerignore
cat > .dockerignore << EOF
# Dependencies
node_modules
npm-debug.log*

# Build outputs
dist
deployment

# Development files
.vite
.cache
.temp

# Git
.git
.gitignore

# Documentation
*.md
docs/

# Tests
tests/
artifacts/

# Monitoring
monitoring/

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Environment
.env
.env.local
.env.development
.env.test
.env.production
EOF

print_success ".dockerignore created"

# Create deployment script
cat > deployment/deploy.sh << 'EOF'
#!/bin/bash
# Quick deployment script for Dokploy

echo "🚀 Deploying ZIKADA 3886 Website..."

# Check if dokploy.yml exists
if [ ! -f "dokploy.yml" ]; then
    echo "❌ dokploy.yml not found"
    exit 1
fi

# Deploy using Docker Compose
docker-compose -f dokploy.yml up -d

echo "✅ Deployment complete!"
echo "🌐 Application: http://localhost:3886"
echo "📊 Grafana: http://localhost:3000"
echo "📈 Prometheus: http://localhost:9090"
EOF

chmod +x deployment/deploy.sh
print_success "Deployment script created"

# Create health check script
cat > deployment/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for ZIKADA 3886 Website

echo "🔍 Checking ZIKADA 3886 Website health..."

# Check if containers are running
if ! docker ps | grep -q "zikada-3886-website"; then
    echo "❌ Main application container is not running"
    exit 1
fi

if ! docker ps | grep -q "zikada-3886-nginx"; then
    echo "❌ Nginx container is not running"
    exit 1
fi

# Check application health
if ! curl -f http://localhost:3886/health > /dev/null 2>&1; then
    echo "❌ Application health check failed"
    exit 1
fi

# Check nginx health
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "❌ Nginx health check failed"
    exit 1
fi

echo "✅ All health checks passed!"
EOF

chmod +x deployment/health-check.sh
print_success "Health check script created"

# Generate build information
print_status "Generating build information..."
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -p "require('./package.json').version")

# Create build info file
cat > deployment/build-info.json << EOF
{
  "version": "$VERSION",
  "buildTime": "$BUILD_TIME",
  "gitCommit": "$GIT_COMMIT",
  "nodeVersion": "$NODE_VERSION",
  "npmVersion": "$NPM_VERSION",
  "environment": "production"
}
EOF

print_success "Build information generated"

# Create deployment summary
print_status "Creating deployment summary..."
cat > deployment/DEPLOYMENT_SUMMARY.md << EOF
# ZIKADA 3886 Website - Deployment Summary

## Build Information
- **Version**: $VERSION
- **Build Time**: $BUILD_TIME
- **Git Commit**: $GIT_COMMIT
- **Node.js**: $NODE_VERSION
- **npm**: $NPM_VERSION

## Files Included
- ✅ Application build (dist/)
- ✅ Docker configuration (dokploy.yml, Dockerfile)
- ✅ Nginx configuration (nginx.conf)
- ✅ Monitoring setup (Prometheus + Grafana)
- ✅ Health check scripts
- ✅ Deployment documentation

## Quick Start
1. Upload the \`deployment/\` directory to your Dokploy server
2. Run \`./deploy.sh\` in the deployment directory
3. Access the application at http://your-domain:3886

## Services
- **Main App**: Port 3886
- **Nginx**: Ports 80, 443
- **Grafana**: Port 3000 (admin/admin)
- **Prometheus**: Port 9090

## Health Checks
- Application: /health
- Metrics: /metrics
- Grafana: http://your-domain:3000

## Next Steps
1. Configure SSL certificates in \`ssl/\` directory
2. Update nginx.conf with your domain name
3. Set up monitoring alerts in Grafana
4. Configure log rotation
5. Set up automated backups

## Support
Refer to the main project documentation for detailed information.
EOF

print_success "Deployment summary created"

# Final verification
print_status "Performing final verification..."
if [ -d "deployment" ] && [ -f "deployment/dokploy.yml" ] && [ -f "deployment/Dockerfile" ]; then
    print_success "Deployment package created successfully!"
    echo ""
    echo "📦 Deployment package location: ./deployment/"
    echo "📋 Files included:"
    ls -la deployment/
    echo ""
    echo "🚀 To deploy:"
    echo "   1. Upload the 'deployment/' directory to your Dokploy server"
    echo "   2. Run './deploy.sh' in the deployment directory"
    echo ""
    echo "🌐 Access points:"
    echo "   - Application: http://your-domain:3886"
    echo "   - Control Panel: http://your-domain:3886/control-panel"
    echo "   - Grafana: http://your-domain:3000"
    echo "   - Prometheus: http://your-domain:9090"
    echo ""
    echo "✅ Deployment preparation complete!"
else
    print_error "Deployment package verification failed"
    exit 1
fi
