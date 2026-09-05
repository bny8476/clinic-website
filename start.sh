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
  echo "==> Starting Backend (Spring Boot)..."
  cd backend
  JAR_FILE=$(ls target/*.jar 2>/dev/null | grep -v '\.original$' | head -n 1)
  if [ -z "$JAR_FILE" ]; then
    echo "==> No pre-built jar found in target/, packaging now..."
    chmod +x mvnw
    ./mvnw clean package -DskipTests
    JAR_FILE=$(ls target/*.jar | grep -v '\.original$' | head -n 1)
  fi
  echo "==> Launching Java application with jar: $JAR_FILE"
  exec java -XX:MaxRAMPercentage=60.0 -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar "$JAR_FILE"
fi
