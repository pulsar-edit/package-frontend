# syntax=docker/dockerfile:1
FROM node:18-slim

# Below we use Dockerfile Labels w/ Pre-defined annotation keys to properly
# link arbitrary container images to the proper Pulsar Repo.
LABEL org.opencontainers.image.source="https://github.com/pulsar-edit/package-frontend"
LABEL org.opencontainers.artifact.description="Social Image Card Microservice for Pulsar Package Frontend"
LABEL description="Social Image Card Microservice for Pulsar Package Frontend"
LABEL org.opencontainers.image.authors="confused-Techie"
LABEL org.opencontainers.image.license="MIT"

# Install latest chrome dev package and fonts to support major charsets
# Note: this installs the necessary libs to make the bundled version of Chromium that
# Puppeteer installs, work.
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Tell puppeteer to skip installing chromium, and use our installed copy instead
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
CMD [ "npm", "start" ]
