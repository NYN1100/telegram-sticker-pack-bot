# Use Node.js 20 (LTS)
FROM node:20-slim

# Install system dependencies required for canvas and sharp
# libglib2.0-dev, libpango1.0-dev, etc. might be needed for @napi-rs/canvas on some distros
# but node:18-slim is usually sufficient or might need simple tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Create tmp directory
RUN mkdir -p tmp

# Start the bot
CMD ["npm", "start"]
