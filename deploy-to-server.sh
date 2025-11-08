#!/bin/bash

# SVG Extrusion Tool Deployment Script
# Deploys the web server and CLI tool to your server

set -e  # Exit on any error

echo "========================================"
echo "SVG Extrusion Tool Deployment"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Variables - UPDATE THESE
INSTALL_DIR="/opt/svg-extrusion-tool"
REPO_URL="https://github.com/notschizo91/listgen.git"
BRANCH="claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R"
APP_PORT="3000"

echo "📁 Installation directory: $INSTALL_DIR"
echo "🔌 Port: $APP_PORT"
echo ""

# Check if directory already exists
if [ -d "$INSTALL_DIR" ]; then
  echo "⚠️  Directory $INSTALL_DIR already exists!"
  read -p "Do you want to remove it and reinstall? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$INSTALL_DIR"
  else
    echo "Aborted."
    exit 1
  fi
fi

# Install Node.js if not present
echo "🔍 Checking for Node.js..."
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
else
  echo "✅ Node.js already installed: $(node --version)"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
  echo "📦 Installing git..."
  apt-get update
  apt-get install -y git
fi

# Clone repository
echo ""
echo "📥 Cloning repository to $INSTALL_DIR..."
git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
git checkout "$BRANCH"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
mkdir -p uploads output

# Create .env file
echo ""
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
PORT=$APP_PORT
NODE_ENV=production
EOF

# Create global command symlink
echo ""
echo "🔗 Creating global command..."
cat > /usr/local/bin/svg-extrude << 'EOF'
#!/bin/bash
cd /opt/svg-extrusion-tool
node src/cli.js "$@"
EOF

chmod +x /usr/local/bin/svg-extrude

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2 process manager..."
  npm install -g pm2
fi

# Stop existing process if running
pm2 delete svg-extrusion-tool 2>/dev/null || true

# Start application with PM2
echo ""
echo "🚀 Starting web server..."
pm2 start server/app.js --name svg-extrusion-tool
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
echo ""

# Configure firewall if ufw is installed
if command -v ufw &> /dev/null; then
  echo "🔥 Configuring firewall..."
  ufw allow $APP_PORT/tcp
  echo "✅ Firewall rule added for port $APP_PORT"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "📍 Installation: $INSTALL_DIR"
echo "🌐 Web URL: http://$SERVER_IP:$APP_PORT"
echo ""
echo "🎯 Two Ways to Use:"
echo ""
echo "1️⃣  WEB INTERFACE (Recommended)"
echo "   Open: http://$SERVER_IP:$APP_PORT"
echo "   • Drag & drop SVG or images"
echo "   • Adjust extrusion parameters"
echo "   • Download STL files"
echo ""
echo "2️⃣  COMMAND LINE"
echo "   svg-extrude examples/star.svg -h 10 -t 45"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                    - Check status"
echo "   pm2 logs svg-extrusion-tool   - View logs"
echo "   pm2 restart svg-extrusion-tool - Restart"
echo "   pm2 stop svg-extrusion-tool    - Stop"
echo ""
echo "🔄 Update Command:"
echo "   cd $INSTALL_DIR"
echo "   git pull origin $BRANCH"
echo "   npm install --production"
echo "   pm2 restart svg-extrusion-tool"
echo ""
echo "📂 Files location: $INSTALL_DIR"
echo ""
