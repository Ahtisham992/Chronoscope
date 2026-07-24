# Start from the official Playwright image which includes Chromium and system dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Install FFmpeg for video stitching
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy package files (we need root package.json for workspaces)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Expose the API port
EXPOSE 4000

# Run the API and workers concurrently
CMD ["npm", "run", "start"]
