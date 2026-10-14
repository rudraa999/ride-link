# ==============================================================================
# UNIFIED FULLSTACK DOCKERFILE FOR AWS (APP RUNNER / ELASTIC BEANSTALK / ECS FARGATE)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Build Frontend (React + Vite)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

# Cache dependencies
COPY frontend/package*.json ./
RUN npm ci || npm install

# Build static assets
COPY frontend/ ./
ARG VITE_GEOAPIFY_API_KEY=
ENV VITE_GEOAPIFY_API_KEY=$VITE_GEOAPIFY_API_KEY
RUN npm run build

# ------------------------------------------------------------------------------
# 2. Build Backend (Spring Boot with Frontend Static Assets)
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /backend

# Cache Maven dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and embed frontend build into Spring Boot static resources
COPY backend/src ./src
COPY --from=frontend-builder /frontend/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# 3. Production Runtime (Java 21 JRE for AWS)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for AWS container health checks
RUN apk add --no-cache curl

# Security: Run as non-privileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy executable jar
COPY --from=backend-builder /backend/target/*.jar app.jar

# AWS ECS / App Runner port (default 8080)
EXPOSE 8080

# Container memory optimizations for AWS (Fargate / App Runner / EC2)
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

# AWS Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# Launch application with exec for proper SIGTERM signal handling during AWS task shutdowns
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
