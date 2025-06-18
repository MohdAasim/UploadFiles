# Use Node.js LTS base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./

# Install dependencies while skipping the prepare script (which runs husky install)
RUN npm install --ignore-scripts

# Copy rest of the application
COPY . .

# Build the application if needed
RUN npm run build

# Expose app port
EXPOSE 5000

# Default command (you can override it from docker-compose)
CMD ["npm", "run", "dev"]