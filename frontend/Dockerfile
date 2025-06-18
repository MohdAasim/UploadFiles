# Build stage
FROM node:20 as build

# Set environment variables to fix SSL issues and disable husky
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV HUSKY=0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Disable husky installation during npm install
RUN npm pkg delete scripts.prepare && npm install

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:stable-alpine

# Copy built files from build stage to nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Create default nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    gzip_comp_level 6; \
    gzip_min_length 1000; \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
