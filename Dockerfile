FROM node:18.17-bullseye-slim
WORKDIR /app

# Install system dependencies for native modules like canvas
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev 

# Ensure host node_modules won't be copied
COPY package*.json ./

# Install everything inside Docker
RUN yarn install 

# Rebuild canvas from source inside Docker to avoid ELF mismatch
# RUN npm rebuild canvas --build-from-source

# Copy rest of app AFTER installing modules
COPY . .

CMD ["node", "app.js"]
