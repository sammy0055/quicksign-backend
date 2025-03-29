# Use the Lambda Node.js 18 base image
FROM public.ecr.aws/lambda/nodejs:18

# Set working directory to /var/task, where Lambda expects the code
WORKDIR /var/task

# Install build tools and libraries required for canvas
RUN yum install -y \
    gcc-c++ \
    make \
    git \
    pkgconfig \
    cairo-devel \
    pango-devel \
    libjpeg-devel \
    giflib-devel \
    librsvg2-devel 

# Install yarn globally
RUN npm install -g yarn@1.22.19

# Copy package.json and yarn.lock (if present) for dependency installation
COPY package*.json ./

# Install dependencies with yarn
RUN yarn install --ignore-scripts

# Explicitly install and build canvas from source
RUN npm install canvas --build-from-source --verbose

# Copy the rest of the application files
COPY . .

# Set the Lambda handler
CMD ["app.handler"]