# Grab latest node image
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install all packages
RUN npm install

# Copy everything to /app
COPY . .

# Run app
CMD [ "npm", "start" ]