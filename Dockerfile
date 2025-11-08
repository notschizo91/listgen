FROM node:18-alpine

# Install dependencies for Sharp and JSCAD
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create output directory
RUN mkdir -p output

# Set environment
ENV NODE_ENV=production

# Default command shows help
CMD ["node", "src/cli.js", "examples"]
