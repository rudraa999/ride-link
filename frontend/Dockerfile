# ==========================================
# 1. Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build argument for Geoapify API Key (optional during build)
ARG VITE_GEOAPIFY_API_KEY=794f89ddf1fa4eb7b2fa9c0613412657
ENV VITE_GEOAPIFY_API_KEY=$VITE_GEOAPIFY_API_KEY

# Build production bundle
RUN npm run build

# ==========================================
# 2. Production Runtime Stage (Nginx)
# ==========================================
FROM nginx:alpine

# Copy built static files to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration template for dynamic env substitution
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default listening port and backend upstream URL
ENV PORT=80
ENV BACKEND_URL=http://backend:8080

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
