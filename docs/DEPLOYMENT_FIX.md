# Dokploy Deployment Fixes

## Issues Fixed

### 1. Nixpacks Build Failure
**Problem:** Nixpacks was failing with `error: undefined variable 'npm'`

**Solution:** Deleted `nixpacks.toml` to force Dokploy to use the existing `Dockerfile` instead.

### 2. Dockerfile Build Issue
**Problem:** The Dockerfile was using `npm ci --only=production` which doesn't install devDependencies needed for building (like `vite`).

**Solution:** Changed to `npm ci` (installs all dependencies) and added cleanup:
```dockerfile
# Line 17
RUN npm ci && npm cache clean --force

# Line 31-37
RUN npm run build && \
    echo "📦 Build completed. Verifying assets..." && \
    ls -la dist/animations/lottie/ 2>/dev/null | head -5 || echo "⚠️ animations/lottie not found" && \
    ls -la dist/lotties/ 2>/dev/null | head -3 || echo "⚠️ lotties not found" && \
    ls -la dist/videos/ 2>/dev/null | head -3 || echo "⚠️ videos not found" && \
    echo "✅ Asset verification complete" && \
    rm -rf node_modules
```

The multi-stage build ensures the production image only contains the built `dist` folder, keeping it small despite installing all dependencies in the builder stage.

### 3. Traefik ACME Challenge Fix
**Problem:** Let's Encrypt ACME challenge was returning 404 because the HTTP router was redirecting all traffic to HTTPS.

**Solution:** Updated Traefik labels in `dokploy.yml` to exclude ACME challenge path:

```yaml
# Line 44
- "traefik.http.routers.zikada-3886-http.rule=Host(`${DOMAIN}`) && !PathPrefix(`/.well-known/acme-challenge`)"
```

### 4. Network Configuration
**Added guidance** for finding the Traefik network name.

## Files Modified

1. `Dockerfile` - Fixed build process
2. `dokploy.yml` - Added ACME challenge exclusion + network comments
3. Deleted `nixpacks.toml` - Removed conflicting configuration

## Next Steps

1. **Commit and push** these changes
2. **Set DOMAIN environment variable** in Dokploy UI to `zikada.io`
3. **Redeploy** in Dokploy
4. **Verify** the build succeeds and Let's Encrypt certificate is issued

## Expected Results

After deployment:
- ✅ Build should succeed using Dockerfile
- ✅ Traefik routers will have ACME challenge exclusion
- ✅ Let's Encrypt certificate should be issued successfully
- ✅ Certificate will show "Let's Encrypt" instead of "TRAEFIK DEFAULT CERT"

