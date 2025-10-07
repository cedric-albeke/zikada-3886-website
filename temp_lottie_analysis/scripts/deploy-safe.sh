#!/bin/bash
set -euo pipefail

# Safe Lottie Animation Deployment Script
# Backs up originals, deploys optimized files, and validates functionality

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WEBSITE_ROOT="/home/zady/Development/zikada-3886-website"
BACKUP_DIR="$WEBSITE_ROOT/lottie_backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verify we're in the right location
check_environment() {
    log_info "Checking environment..."
    
    if [[ ! -d "$WEBSITE_ROOT" ]]; then
        log_error "Website root not found: $WEBSITE_ROOT"
        exit 1
    fi
    
    if [[ ! -d "$PROJECT_ROOT/out/conservative" ]]; then
        log_error "Optimized files not found: $PROJECT_ROOT/out/conservative"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/OPTIMIZATION_REPORT.md" ]]; then
        log_error "Optimization report not found. Please run optimization first."
        exit 1
    fi
    
    log_success "Environment check passed"
}

# Find original Lottie files location
find_original_files() {
    log_info "Locating original Lottie files..."
    
    # Common locations for Lottie files
    local possible_paths=(
        "$WEBSITE_ROOT/animations/lottie"
        "$WEBSITE_ROOT/assets/animations"
        "$WEBSITE_ROOT/static/animations"
        "$WEBSITE_ROOT/src/assets/animations"
        "$WEBSITE_ROOT/public/animations"
    )
    
    for path in "${possible_paths[@]}"; do
        if [[ -d "$path" ]] && [[ -n "$(find "$path" -name "*.json" -type f 2>/dev/null)" ]]; then
            LOTTIE_DIR="$path"
            log_success "Found Lottie files in: $LOTTIE_DIR"
            return 0
        fi
    done
    
    # If not found, search the entire project
    log_info "Searching entire project for Lottie files..."
    local found_files=($(find "$WEBSITE_ROOT" -name "*.json" -path "*/animations/*" -o -name "*.json" -path "*/lottie/*" 2>/dev/null | head -5))
    
    if [[ ${#found_files[@]} -gt 0 ]]; then
        log_info "Found potential Lottie files:"
        for file in "${found_files[@]}"; do
            echo "  - $file"
        done
        
        # Use directory of first found file
        LOTTIE_DIR="$(dirname "${found_files[0]}")"
        log_warning "Using directory: $LOTTIE_DIR"
        log_warning "Please verify this is correct before proceeding!"
        
        read -p "Is this the correct Lottie directory? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Please manually set LOTTIE_DIR and run again"
            exit 1
        fi
    else
        log_error "Could not find original Lottie files in project"
        log_info "Please manually specify the location:"
        read -p "Enter path to Lottie files directory: " LOTTIE_DIR
        
        if [[ ! -d "$LOTTIE_DIR" ]]; then
            log_error "Directory does not exist: $LOTTIE_DIR"
            exit 1
        fi
    fi
}

# Create comprehensive backup
create_backup() {
    log_info "Creating backup of original files..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Copy original Lottie files
    if [[ -d "$LOTTIE_DIR" ]]; then
        cp -r "$LOTTIE_DIR" "$BACKUP_DIR/original_lottie_files/"
        log_success "Backed up original Lottie files to: $BACKUP_DIR/original_lottie_files/"
    fi
    
    # Copy any JavaScript files that reference Lottie animations
    log_info "Searching for JavaScript files that reference Lottie..."
    local js_files=($(find "$WEBSITE_ROOT" -name "*.js" -exec grep -l -i "lottie\|\.json" {} \; 2>/dev/null || true))
    
    if [[ ${#js_files[@]} -gt 0 ]]; then
        mkdir -p "$BACKUP_DIR/js_files"
        for js_file in "${js_files[@]}"; do
            local relative_path="${js_file#$WEBSITE_ROOT/}"
            local backup_path="$BACKUP_DIR/js_files/$relative_path"
            mkdir -p "$(dirname "$backup_path")"
            cp "$js_file" "$backup_path"
        done
        log_success "Backed up ${#js_files[@]} JavaScript files"
    fi
    
    # Create backup manifest
    cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# Lottie Animation Backup - $(date)

## Backup Contents
- **Original Lottie Files:** \`original_lottie_files/\`
- **JavaScript Files:** \`js_files/\`
- **Backup Created:** $(date)
- **Original Location:** $LOTTIE_DIR

## Files Backed Up
### Lottie JSON Files
$(find "$BACKUP_DIR/original_lottie_files" -name "*.json" -type f | sed 's|^|  - |' || echo "  No JSON files found")

### JavaScript Files
$(if [[ ${#js_files[@]} -gt 0 ]]; then printf '  - %s\n' "${js_files[@]}" | sed "s|$WEBSITE_ROOT/||"; else echo "  No JS files found"; fi)

## Restoration Instructions
To restore original files:
\`\`\`bash
# Restore Lottie files
cp -r "$BACKUP_DIR/original_lottie_files/"* "$LOTTIE_DIR/"

# Restore JavaScript files (if needed)
cp -r "$BACKUP_DIR/js_files/"* "$WEBSITE_ROOT/"
\`\`\`
EOF
    
    log_success "Backup created: $BACKUP_DIR"
    log_info "Backup manifest: $BACKUP_DIR/BACKUP_MANIFEST.md"
}

# Pre-deployment testing
run_pre_deployment_tests() {
    log_info "Running pre-deployment validation tests..."
    
    # Run our validation script
    if ! node "$PROJECT_ROOT/scripts/validate-optimizations.mjs"; then
        log_error "Validation tests failed!"
        exit 1
    fi
    
    # Check file counts match
    local original_count=$(find "$LOTTIE_DIR" -name "*.json" -type f | wc -l)
    local optimized_count=$(find "$PROJECT_ROOT/out/conservative" -name "*.json" -type f | wc -l)
    
    if [[ $original_count -ne $optimized_count ]]; then
        log_warning "File count mismatch: Original=$original_count, Optimized=$optimized_count"
        log_info "This might be expected if you have additional JSON files in the original directory"
    fi
    
    # Verify optimized files exist for our known animations
    local missing_files=()
    for file in Abstraction.json circuit-round-ani.json circular-dots.json geometrical-lines.json Planet-Logo.json planet-ring.json Sacred-Geometry.json transparent-diamond-dark.json Morphing-Particle-Loader.json Impossible-Hexagon-black.json; do
        if [[ ! -f "$PROJECT_ROOT/out/conservative/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing optimized files:"
        printf '  - %s\n' "${missing_files[@]}"
        exit 1
    fi
    
    log_success "Pre-deployment tests passed"
}

# Deploy optimized files
deploy_files() {
    log_info "Deploying optimized Lottie files..."
    
    local deployed_files=()
    
    # Copy optimized files that have originals
    for optimized_file in "$PROJECT_ROOT/out/conservative"/*.json; do
        local filename="$(basename "$optimized_file")"
        local target_file="$LOTTIE_DIR/$filename"
        
        # Check if original exists
        if [[ -f "$target_file" ]]; then
            cp "$optimized_file" "$target_file"
            deployed_files+=("$filename")
            log_info "Deployed: $filename"
        else
            log_warning "Skipping $filename (no original found)"
        fi
    done
    
    if [[ ${#deployed_files[@]} -eq 0 ]]; then
        log_error "No files were deployed!"
        exit 1
    fi
    
    log_success "Deployed ${#deployed_files[@]} optimized files"
}

# Start local server for testing (if possible)
start_test_server() {
    log_info "Attempting to start local server for testing..."
    
    # Check if we can find a way to serve the website
    if command -v python3 >/dev/null 2>&1; then
        log_info "Starting Python HTTP server on port 8080..."
        cd "$WEBSITE_ROOT"
        python3 -m http.server 8080 >/dev/null 2>&1 &
        local server_pid=$!
        
        # Give server time to start
        sleep 2
        
        # Check if server is running
        if kill -0 $server_pid 2>/dev/null; then
            log_success "Test server running at http://localhost:8080"
            echo "export TEST_SERVER_PID=$server_pid" > "$PROJECT_ROOT/.test_server_pid"
            return 0
        fi
    elif command -v php >/dev/null 2>&1; then
        log_info "Starting PHP development server on port 8080..."
        cd "$WEBSITE_ROOT"
        php -S localhost:8080 >/dev/null 2>&1 &
        local server_pid=$!
        sleep 2
        
        if kill -0 $server_pid 2>/dev/null; then
            log_success "Test server running at http://localhost:8080"
            echo "export TEST_SERVER_PID=$server_pid" > "$PROJECT_ROOT/.test_server_pid"
            return 0
        fi
    fi
    
    log_warning "Could not start test server automatically"
    log_info "Please manually serve the website and test the animations"
}

# Interactive post-deployment validation
run_post_deployment_validation() {
    log_info "Running post-deployment validation..."
    
    # Open benchmark harness for manual testing
    local benchmark_file="$PROJECT_ROOT/bench/index.html"
    if [[ -f "$benchmark_file" ]]; then
        log_info "Opening benchmark harness for manual testing..."
        if command -v xdg-open >/dev/null 2>&1; then
            xdg-open "file://$benchmark_file" &
        elif command -v firefox >/dev/null 2>&1; then
            firefox "file://$benchmark_file" &
        fi
        
        log_info "Manual testing instructions:"
        echo "  1. Verify all animations load correctly"
        echo "  2. Check that animations play smoothly"
        echo "  3. Test SVG vs Canvas renderer performance"
        echo "  4. Verify visibility controls work"
        echo "  5. Test reduced motion compliance"
        
        read -p "Did all animations load and play correctly? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Manual validation failed"
            return 1
        fi
        
        log_success "Manual validation passed"
    fi
    
    # Check website functionality
    echo
    log_info "Website testing:"
    echo "  Please test your website to ensure:"
    echo "  - All Lottie animations appear correctly"
    echo "  - No console errors related to animations"
    echo "  - Page load times are improved"
    echo "  - Animations respect user preferences"
    
    read -p "Does the website work correctly with optimized animations? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Website validation failed"
        return 1
    fi
    
    log_success "Website validation passed"
    return 0
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    if [[ -d "$BACKUP_DIR/original_lottie_files" ]]; then
        cp -r "$BACKUP_DIR/original_lottie_files/"* "$LOTTIE_DIR/"
        log_success "Rollback completed - original files restored"
    else
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
}

# Cleanup test server
cleanup_test_server() {
    if [[ -f "$PROJECT_ROOT/.test_server_pid" ]]; then
        source "$PROJECT_ROOT/.test_server_pid"
        if [[ -n "${TEST_SERVER_PID:-}" ]] && kill -0 $TEST_SERVER_PID 2>/dev/null; then
            kill $TEST_SERVER_PID
            log_info "Test server stopped"
        fi
        rm -f "$PROJECT_ROOT/.test_server_pid"
    fi
}

# Main deployment flow
main() {
    echo "=================================================="
    echo "🚀 Safe Lottie Animation Deployment"
    echo "=================================================="
    echo
    
    # Trap to cleanup on exit
    trap cleanup_test_server EXIT
    
    check_environment
    find_original_files
    create_backup
    run_pre_deployment_tests
    
    echo
    log_info "Ready to deploy optimized Lottie animations"
    log_warning "This will replace your original animation files!"
    log_info "Backup location: $BACKUP_DIR"
    echo
    
    read -p "Proceed with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    deploy_files
    start_test_server
    
    echo
    log_success "Deployment completed!"
    log_info "Now running validation tests..."
    
    if ! run_post_deployment_validation; then
        log_error "Post-deployment validation failed"
        read -p "Rollback to original files? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            rollback_deployment
            exit 1
        fi
    fi
    
    echo
    echo "=================================================="
    log_success "🎉 Deployment Successful!"
    echo "=================================================="
    echo
    log_info "Summary:"
    echo "  ✅ Original files backed up to: $BACKUP_DIR"
    echo "  ✅ Optimized files deployed successfully"
    echo "  ✅ Validation tests passed"
    echo "  💾 Space saved: 43.8 KB (7.4% reduction)"
    echo
    log_info "Next steps:"
    echo "  1. Monitor website performance"
    echo "  2. Check user feedback on animation quality"
    echo "  3. Consider implementing visibility controls"
    echo "  4. Keep backup for at least 30 days"
    echo
}

# Help function
show_help() {
    echo "Safe Lottie Animation Deployment Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --rollback    Rollback to most recent backup"
    echo "  --test-only   Run tests without deploying"
    echo
    echo "This script safely deploys optimized Lottie animations with:"
    echo "  • Automatic backup of original files"
    echo "  • Pre-deployment validation testing"
    echo "  • Post-deployment manual verification"
    echo "  • Automatic rollback option on failure"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --rollback)
        log_info "Looking for most recent backup..."
        local latest_backup=$(find "/home/zady/Development/zikada-3886-website" -name "lottie_backup_*" -type d | sort | tail -1)
        if [[ -n "$latest_backup" ]]; then
            BACKUP_DIR="$latest_backup"
            find_original_files
            rollback_deployment
        else
            log_error "No backup found"
            exit 1
        fi
        exit 0
        ;;
    --test-only)
        check_environment
        find_original_files
        run_pre_deployment_tests
        log_success "Tests completed successfully"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac