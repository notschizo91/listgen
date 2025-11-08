#!/bin/bash

# SVG Extrusion Tool Deployment Script
# Deploys the CLI tool to your server for command-line usage

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

echo "📁 Installation directory: $INSTALL_DIR"
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
mkdir -p output

# Create global command symlink
echo ""
echo "🔗 Creating global command..."
cat > /usr/local/bin/svg-extrude << 'EOF'
#!/bin/bash
cd /opt/svg-extrusion-tool
node src/cli.js "$@"
EOF

chmod +x /usr/local/bin/svg-extrude

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "📍 Installation: $INSTALL_DIR"
echo "🖥️  Server IP: $SERVER_IP"
echo ""
echo "🔧 Usage:"
echo "   svg-extrude examples/star.svg"
echo "   svg-extrude examples/gear.svg -h 10 -t 45"
echo "   svg-extrude image photo.png -h 8"
echo "   svg-extrude batch \"*.svg\" -h 10"
echo "   svg-extrude examples  # Show all examples"
echo ""
echo "📂 Files location: $INSTALL_DIR"
echo "📤 Output files:   $INSTALL_DIR/output"
echo ""
echo "💡 To use from any directory:"
echo "   1. Upload your SVG: scp myfile.svg user@$SERVER_IP:/tmp/"
echo "   2. SSH in and run: svg-extrude /tmp/myfile.svg"
echo "   3. Download result: scp user@$SERVER_IP:$INSTALL_DIR/output/myfile.stl ."
echo ""
