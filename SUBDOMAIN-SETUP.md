# Subdomain Setup Guide

Set up SVG Extrusion Tool on a subdomain (e.g., build.3dsidehustle.com)

## Prerequisites

- Domain DNS configured (A record pointing to your server IP)
- Server with Nginx installed
- SSL certificate (Let's Encrypt)

## Step 1: Add DNS Record

In your domain registrar (Cloudflare, Namecheap, etc.):

```
Type: A
Name: build
Value: YOUR_SERVER_IP
TTL: Auto
```

Wait a few minutes for DNS propagation.

## Step 2: Deploy the Application

SSH into your server and run the deployment script:

```bash
# Copy deployment script
scp deploy-to-server.sh root@your-server:/tmp/

# SSH and deploy
ssh root@your-server
chmod +x /tmp/deploy-to-server.sh
/tmp/deploy-to-server.sh
```

This installs to `/opt/svg-extrusion-tool` and starts on port 3000.

## Step 3: Create Nginx Configuration

Create nginx config file:

```bash
nano /etc/nginx/sites-available/build.3dsidehustle.com
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name build.3dsidehustle.com;

    # Increase upload size for large images/SVGs
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long conversions
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

## Step 4: Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/build.3dsidehustle.com /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## Step 5: Install SSL Certificate

```bash
# Install certbot if not already installed
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d build.3dsidehustle.com
```

Follow the prompts:
1. Enter your email
2. Agree to terms
3. Choose whether to redirect HTTP to HTTPS (recommended: yes)

## Step 6: Verify

Visit your subdomain:
```
https://build.3dsidehustle.com
```

You should see the SVG Extrusion Tool interface!

## Troubleshooting

### DNS not resolving?
```bash
# Check DNS
nslookup build.3dsidehustle.com
dig build.3dsidehustle.com
```

Wait 5-10 minutes for propagation if just added.

### Nginx error?
```bash
# Check nginx logs
tail -f /var/log/nginx/error.log

# Check nginx status
systemctl status nginx
```

### App not running?
```bash
# Check PM2
pm2 status
pm2 logs svg-extrusion-tool

# Restart if needed
pm2 restart svg-extrusion-tool
```

### SSL certificate error?
```bash
# Check certificate status
certbot certificates

# Renew if needed
certbot renew --dry-run
```

### File upload failing?
Check nginx client_max_body_size in the config (should be 20M or higher)

## Managing Multiple Subdomains

If you already have other apps on subdomains, this won't conflict. Each subdomain proxies to a different port:

- `yourdomain.com` → main site
- `stl.3dsidehustle.com` → STLPipeline (port 3000 or different port)
- `build.3dsidehustle.com` → SVG Extrusion Tool (port 3000)

**Note:** If you have STLPipeline on the same server, you'll need to change one of the ports!

## Changing the Port (if needed)

If port 3000 is already in use:

```bash
# Edit .env file
nano /opt/svg-extrusion-tool/.env

# Change PORT to something else (e.g., 3001)
PORT=3001

# Restart
pm2 restart svg-extrusion-tool

# Update nginx config
nano /etc/nginx/sites-available/build.3dsidehustle.com
# Change proxy_pass to http://localhost:3001

# Reload nginx
nginx -t && systemctl reload nginx
```

## Auto-Renewal of SSL

Certbot sets up auto-renewal. Verify it works:

```bash
# Test renewal
certbot renew --dry-run

# Check cron/systemd timer
systemctl list-timers | grep certbot
```

## Complete Quick Setup Script

Save this as `setup-subdomain.sh`:

```bash
#!/bin/bash

SUBDOMAIN="build.3dsidehustle.com"
APP_PORT="3000"

echo "Setting up $SUBDOMAIN..."

# Create nginx config
cat > /etc/nginx/sites-available/$SUBDOMAIN << 'EOF'
server {
    listen 80;
    server_name build.3dsidehustle.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/$SUBDOMAIN /etc/nginx/sites-enabled/

# Test and reload nginx
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d $SUBDOMAIN --non-interactive --agree-tos --email your@email.com

echo "✅ Setup complete!"
echo "Visit: https://$SUBDOMAIN"
```

Run it:
```bash
chmod +x setup-subdomain.sh
./setup-subdomain.sh
```
