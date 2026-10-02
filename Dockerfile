# ==============================================================================
# UNIFIED FULLSTACK DOCKERFILE (ZOHO CATALYST APPSAIL / SINGLE CONTAINER DEPLOY)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Build Frontend (React + Vite)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
ARG VITE_GEOAPIFY_API_KEY=794f89ddf1fa4eb7b2fa9c0613412657
ENV VITE_GEOAPIFY_API_KEY=$VITE_GEOAPIFY_API_KEY
RUN npm run build

# ------------------------------------------------------------------------------
# 2. Build Backend (Spring Boot with Frontend Static Assets)
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /backend

COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

COPY backend/src ./src

# Copy built frontend assets into Spring Boot's static resource directory
COPY --from=frontend-builder /frontend/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# 3. Production Runtime (Java 21 JRE for Zoho Catalyst AppSail)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=backend-builder /backend/target/*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

# Listens on Catalyst's injected $X_ZOHO_CATALYST_LISTEN_PORT or fallback to $PORT / 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${X_ZOHO_CATALYST_LISTEN_PORT:-${PORT:-8080}} -jar app.jar"]
