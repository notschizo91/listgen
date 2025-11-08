# Quick Update Guide

## Update Your Deployed Server (One Command)

Just like STLPipeline, use this one-liner to update and restart:

```bash
cd /opt/svg-extrusion-tool && git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R && npm install --production && pm2 restart svg-extrusion-tool
```

Or even shorter:

```bash
cd /opt/svg-extrusion-tool && git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R && pm2 restart svg-extrusion-tool
```

(The second one skips `npm install` if you know dependencies didn't change)

## Step by Step

If you prefer to see each step:

```bash
# 1. Navigate to the app directory
cd /opt/svg-extrusion-tool

# 2. Pull latest changes
git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R

# 3. Install any new dependencies (optional if no package.json changes)
npm install --production

# 4. Restart the server
pm2 restart svg-extrusion-tool
```

## Check Status

```bash
pm2 status
pm2 logs svg-extrusion-tool
```

## PM2 Commands Reference

```bash
pm2 status                    # Check if running
pm2 logs svg-extrusion-tool   # View live logs
pm2 restart svg-extrusion-tool # Restart (after updates)
pm2 stop svg-extrusion-tool    # Stop the server
pm2 start svg-extrusion-tool   # Start the server
pm2 save                      # Save PM2 config
```

## Troubleshooting

### Server not responding after update?

```bash
pm2 restart svg-extrusion-tool
pm2 logs svg-extrusion-tool
```

### Dependencies issue?

```bash
cd /opt/svg-extrusion-tool
rm -rf node_modules
npm install --production
pm2 restart svg-extrusion-tool
```

### Need to redeploy from scratch?

```bash
# Stop and remove PM2 process
pm2 delete svg-extrusion-tool

# Remove old installation
rm -rf /opt/svg-extrusion-tool

# Run deployment script again
./deploy-to-server.sh
```

## Access Your Server

After updating, open in browser:
```
http://YOUR-SERVER-IP:3000
```

Or use the CLI:
```bash
svg-extrude examples/star.svg -h 10 -t 45
```
