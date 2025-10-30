# How to Find Traefik Network Name in Dokploy

## Method 1: Check Traefik Container Networks (Recommended)

SSH into your Dokploy server and run:

```bash
# Find the Traefik container
docker ps | grep traefik

# Inspect the Traefik container to see its networks
docker inspect $(docker ps -q --filter "name=traefik") | grep -A 10 "Networks"
```

Or more directly:

```bash
# List all networks that Traefik is connected to
docker inspect $(docker ps -q --filter "name=traefik") --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}'
```

## Method 2: List All Docker Networks

```bash
# List all Docker networks
docker network ls

# Look for networks that might be related to Dokploy/Traefik
# Common names:
# - dokploy-network
# - traefik-network
# - dokploy_traefik
# - dokploy_default
```

## Method 3: Check from Any Container on the Same Network

If you have another application running in Dokploy:

```bash
# Inspect any container deployed via Dokploy
docker inspect <container-name> | grep -A 10 "Networks"

# Or check the network directly
docker inspect <container-name> --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}'
```

## Method 4: Check Dokploy Configuration Files

On the Dokploy server, check configuration files:

```bash
# Common locations for Dokploy config
ls -la /opt/dokploy/
ls -la ~/.dokploy/
cat /opt/dokploy/docker-compose.yml  # If Dokploy uses compose
```

Look for network definitions in these files.

## Method 5: Check via Dokploy UI

1. Go to your Dokploy dashboard
2. Navigate to **Settings** → **Traefik** or **Reverse Proxy**
3. Look for network configuration
4. Or check any deployed application's configuration to see what network it uses

## Method 6: Use Docker Compose (if Dokploy uses it)

If Dokploy manages Traefik via docker-compose:

```bash
# Find the compose file
find /opt/dokploy -name "docker-compose.yml" -o -name "compose.yml"

# Check the network name in the compose file
grep -A 5 "networks:" /path/to/dokploy/docker-compose.yml
```

## Quick Test: Check Your Current Application

If your application is already deployed and working, you can check what network it's using:

```bash
# Replace with your actual container name
docker inspect zikada-3886-website | grep -A 10 "Networks"
```

## Common Dokploy Network Names

Based on Dokploy deployments, common network names include:
- `dokploy-network`
- `dokploy_traefik`
- `traefik_network`
- `dokploy_default`
- `dokploy-network_network` (if namespaced by organization)

## Alternative: Let Dokploy Manage It Automatically

If you're unsure, you can remove the network configuration from `dokploy.yml` and let Dokploy manage it:

```yaml
# Remove this section entirely:
# networks:
#   default:
#     external: true
#     name: dokploy-network

# Or use bridge network (Dokploy will handle routing via Traefik):
networks:
  default:
    driver: bridge
```

Dokploy's Traefik should still be able to discover your service via Docker labels, even if the network is managed automatically.

## Verify Network After Finding

Once you find the network name, verify Traefik is on it:

```bash
# Replace NETWORK_NAME with the name you found
docker network inspect NETWORK_NAME | grep -i traefik
```

