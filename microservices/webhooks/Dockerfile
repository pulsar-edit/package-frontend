# syntax=docker/dockerfile:1
FROM node:18-slim

# Below we use Dockerfile Labels w/ predefined annotation keys to properly link arbitrary
# container images to the proper Pulsar Repo.
LABEL org.opencontainers.artifact.description="Microservice to handle custom webhooks for Pulsar-Edit"
LABEL org.opencontainers.image.source="https://github.com/pulsar-edit/package-frontend"
LABEL org.opencontainers.image.author="confused-Techie"
LABEL org.opencontainers.image.license="MIT"
LABEL org.opencontainers.image.description="Microservice to handle custom webhooks for Pulsar-Edit"
LABEL description="Microservice to handle custom webhooks for Pulsar-Edit"

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup
CMD [ "npm", "start" ]
