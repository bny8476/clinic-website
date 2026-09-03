#!/usr/bin/env bash
set -e

# Railpack Root Entrypoint
# Checks if running backend or frontend based on APP_SERVICE environment variable,
# or defaults to backend Spring Boot application.

if [ "$APP_SERVICE" = "frontend" ]; then
  echo "==> Building and starting Frontend..."
  cd frontend
  npm install
  npm run build
  npm run preview -- --host 0.0.0.0 --port ${PORT:-8080}
else
  echo "==> Building and starting Backend (Spring Boot)..."
  cd backend
  chmod +x mvnw
  ./mvnw clean package -DskipTests
  JAR_FILE=$(ls target/*.jar | head -n 1)
  java -XX:MaxRAMPercentage=60.0 -XX:+UseSerialGC -jar "$JAR_FILE"
fi
