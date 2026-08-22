FROM node:20-bookworm-slim

WORKDIR /app

# Install essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose Metro bundler and dev server ports
EXPOSE 8081 19000 19001 19002

# Environment configuration for Metro and polling watchers
ENV CI=1 \
    EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
    REACT_NATIVE_PACKAGER_HOSTNAME=localhost \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true

CMD ["npx", "expo", "start", "--host", "lan"]
