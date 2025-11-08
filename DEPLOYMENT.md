# Deployment Guide

Deploy the SVG Extrusion Tool to your server for command-line usage.

## Quick Deploy (Automated)

### 1. Copy deployment script to your server

```bash
scp deploy-to-server.sh root@your-server-ip:/tmp/
```

### 2. SSH into your server and run it

```bash
ssh root@your-server-ip
chmod +x /tmp/deploy-to-server.sh
/tmp/deploy-to-server.sh
```

The script will:
- Install Node.js 18 if needed
- Clone the repository to `/opt/svg-extrusion-tool`
- Install all dependencies
- Create a global `svg-extrude` command

### 3. Start using it!

```bash
svg-extrude examples/star.svg
```

## Manual Installation

If you prefer manual installation:

### 1. Clone the repository

```bash
cd /opt
git clone https://github.com/notschizo91/listgen.git svg-extrusion-tool
cd svg-extrusion-tool
git checkout claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R
```

### 2. Install dependencies

```bash
npm install --production
```

### 3. Create global command (optional)

```bash
cat > /usr/local/bin/svg-extrude << 'EOF'
#!/bin/bash
cd /opt/svg-extrusion-tool
node src/cli.js "$@"
EOF

chmod +x /usr/local/bin/svg-extrude
```

## Usage on Server

### Upload and convert files

```bash
# Upload your SVG
scp mylogo.svg user@your-server:/tmp/

# SSH in and convert
ssh user@your-server
svg-extrude /tmp/mylogo.svg -h 10 -t 45

# Download the result
scp user@your-server:/opt/svg-extrusion-tool/output/mylogo.stl ./
```

### Batch processing

```bash
# Upload multiple files
scp designs/*.svg user@your-server:/tmp/designs/

# Convert them all
ssh user@your-server
svg-extrude batch "/tmp/designs/*.svg" -h 8 -o /tmp/output

# Download results
scp -r user@your-server:/tmp/output/*.stl ./results/
```

## Docker Deployment (Alternative)

If you prefer Docker:

### 1. Copy Dockerfile to server

```bash
scp Dockerfile docker-compose.yml user@your-server:/opt/svg-extrusion-tool/
```

### 2. Build and run

```bash
ssh user@your-server
cd /opt/svg-extrusion-tool
docker-compose up -d
```

### 3. Use via Docker

```bash
docker exec svg-extrusion-tool svg-extrude examples/star.svg
```

## Updating the Tool

To update to the latest version:

```bash
cd /opt/svg-extrusion-tool
git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R
npm install --production
```

## Troubleshooting

### Permission Issues

```bash
chmod +x /usr/local/bin/svg-extrude
chmod -R 755 /opt/svg-extrusion-tool
```

### Missing Dependencies

```bash
cd /opt/svg-extrusion-tool
npm install
```

### Node.js Version

Requires Node.js 16+. Check version:

```bash
node --version
```

Update if needed:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

## Server Requirements

- **OS**: Ubuntu 20.04+, Debian 10+, or similar
- **RAM**: 512MB minimum, 1GB+ recommended
- **Disk**: 200MB for app + space for output files
- **Node.js**: 16.x or higher
- **Arch**: x64 (required for Sharp image library)

## Security Notes

- The tool runs as a CLI application, no web ports exposed
- All file operations happen locally on the server
- No authentication needed (command-line only)
- Use SSH keys for secure server access
