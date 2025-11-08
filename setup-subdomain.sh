#!/bin/bash

# Quick Subdomain Setup Script for SVG Extrusion Tool
# Usage: ./setup-subdomain.sh build.3dsidehustle.com your@email.com

set -e

SUBDOMAIN=${1:-"build.3dsidehustle.com"}
EMAIL=${2:-"admin@3dsidehustle.com"}
APP_PORT="3000"

echo "========================================"
echo "Subdomain Setup for SVG Extrusion Tool"
echo "========================================"
echo ""
echo "Subdomain: $SUBDOMAIN"
echo "App Port: $APP_PORT"
echo "Email: $EMAIL"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Check if app is running
if ! pm2 list | grep -q "svg-extrusion-tool"; then
  echo "⚠️  App not running! Deploy first with deploy-to-server.sh"
  exit 1
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
  echo "📦 Installing Nginx..."
  apt update
  apt install -y nginx
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
  echo "📦 Installing Certbot..."
  apt install -y certbot python3-certbot-nginx
fi

# Create nginx configuration
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$SUBDOMAIN << EOF
server {
    listen 80;
    server_name $SUBDOMAIN;

    # Increase upload size for large images/SVGs
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeout settings for long conversions
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable site
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/$SUBDOMAIN /etc/nginx/sites-enabled/

# Test nginx configuration
echo "✅ Testing Nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Get SSL certificate
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $SUBDOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo ""
echo "========================================"
echo "✅ Subdomain Setup Complete!"
echo "========================================"
echo ""
echo "🌐 Your app is now available at:"
echo "   https://$SUBDOMAIN"
echo ""
echo "🔧 Nginx config: /etc/nginx/sites-available/$SUBDOMAIN"
echo "📜 SSL auto-renews via certbot"
echo ""
echo "💡 Next steps:"
echo "   1. Visit https://$SUBDOMAIN"
echo "   2. Upload an SVG or image"
echo "   3. Adjust parameters and download STL!"
echo ""
