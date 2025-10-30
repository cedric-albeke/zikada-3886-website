# Dokploy Traefik Configuration for Let's Encrypt

## Problem
The certificate shows "TRAEFIK DEFAULT CERT" instead of a proper Let's Encrypt certificate. This happens when Traefik labels are missing or incorrectly configured.

## Solution
The `dokploy.yml` file has been updated with proper Traefik labels for automatic Let's Encrypt certificate acquisition.

## Changes Made

### 1. Removed Custom Nginx Service
- Dokploy uses Traefik as its reverse proxy
- The custom nginx service conflicts with Traefik's automatic certificate management

### 2. Added Traefik Labels
The following labels enable automatic SSL/TLS certificate acquisition:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.zikada-3886-http.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.zikada-3886-http.entrypoints=web"
  - "traefik.http.routers.zikada-3886-http.middlewares=redirect-to-https"
  - "traefik.http.routers.zikada-3886-https.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.zikada-3886-https.entrypoints=websecure"
  - "traefik.http.routers.zikada-3886-https.tls=true"
  - "traefik.http.routers.zikada-3886-https.tls.certresolver=letsencrypt"
  - "traefik.http.services.zikada-3886.loadbalancer.server.port=3886"
```

### 3. Changed Port Mapping
- Changed from `ports` to `expose` (internal only)
- Traefik handles external routing on ports 80/443

### 4. Updated Network Configuration
- Set network to use Dokploy's external network

## Required Configuration in Dokploy UI

### Environment Variables
You **must** set the following environment variable in Dokploy's UI:

1. Go to your project settings in Dokploy
2. Navigate to **Environment Variables**
3. Add:
   - **Key**: `DOMAIN`
   - **Value**: Your domain name (e.g., `example.com` or `www.example.com`)

### Optional: Certificate Resolver Name
The default certificate resolver is `letsencrypt`. If your Dokploy organization uses a different name, you may need to adjust:

**Common alternatives:**
- `le` (short for Let's Encrypt)
- `acme` (ACME protocol name)
- Organization-specific name (check your Dokploy Traefik config)

**To change the resolver:**
Edit line 51 in `dokploy.yml`:
```yaml
- "traefik.http.routers.zikada-3886-https.tls.certresolver=YOUR_RESOLVER_NAME"
```

### Optional: Network Name
If `dokploy-network` doesn't exist in your setup, you may need to:
1. Check the actual network name in Dokploy
2. Update line 181 in `dokploy.yml`:
```yaml
name: YOUR_NETWORK_NAME
```

Or remove the network configuration entirely if Dokploy manages it automatically:
```yaml
networks:
  default:
    driver: bridge
```

### Optional: Entrypoint Names
The default entrypoints are `web` (HTTP) and `websecure` (HTTPS). If your Dokploy uses different names:
- Check your Traefik configuration
- Update lines 44 and 49 in `dokploy.yml`

## Verification Steps

1. **Set the DOMAIN environment variable** in Dokploy UI
2. **Deploy or redeploy** the application
3. **Check Traefik logs** for certificate acquisition:
   ```bash
   docker logs traefik 2>&1 | grep -i acme
   ```
4. **Verify the certificate** by visiting your domain and checking the certificate details
5. **Wait a few minutes** - Let's Encrypt certificate acquisition can take 1-5 minutes

## Troubleshooting

### Certificate still shows "TRAEFIK DEFAULT CERT"

1. **Verify DOMAIN environment variable is set** in Dokploy UI
2. **Check certificate resolver name** - try `le` instead of `letsencrypt`
3. **Verify domain DNS** points to your Dokploy server
4. **Check Traefik logs** for ACME errors
5. **Ensure port 80 is accessible** - Let's Encrypt HTTP-01 challenge requires it

### Service not reachable

1. **Check network name** - verify it matches Dokploy's network
2. **Verify entrypoint names** match your Traefik configuration
3. **Check service logs**: `docker logs zikada-3886-website`

### HTTP redirect not working

If HTTP doesn't redirect to HTTPS:
- The redirect middleware is defined in the labels
- Verify entrypoint names are correct
- Check if Dokploy already provides a redirect middleware (you may need to use that instead)

## Additional Notes

- **No manual certificate files needed** - Traefik handles everything automatically
- **Automatic renewal** - Let's Encrypt certificates are renewed automatically
- **Certificate storage** - Dokploy/Traefik stores certificates internally (no volume mounts needed)
- **Multiple domains** - To add more domains, add additional router labels or modify the Host rule

## Reference

- [Traefik Let's Encrypt Documentation](https://doc.traefik.io/traefik/v2.11/https/acme/)
- [Dokploy Documentation](https://dokploy.com/docs)

