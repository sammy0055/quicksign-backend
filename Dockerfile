# First stage: Use a Node.js image with package managers
FROM node:20 AS builder

WORKDIR /app

# Install Git (already included in this base image)
RUN apt-get update && apt-get install -y git

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .
# COPY .env .env

# Second stage: Use AWS Lambda base image
FROM public.ecr.aws/lambda/nodejs:20

WORKDIR /app

# Copy the built node_modules and app files from the builder stage
COPY --from=builder /app ${LAMBDA_TASK_ROOT}
# COPY --from=builder /app/.env ${LAMBDA_TASK_ROOT}/.env

# Ensure .env is readable (optional)
# RUN chmod 600 ${LAMBDA_TASK_ROOT}/.env

CMD [ "app.handler" ]
