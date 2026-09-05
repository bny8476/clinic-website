# Multi-stage Dockerfile for Spring Boot Backend on Railway / Cloud Platforms
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copy pom.xml and source code
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

WORKDIR /app/backend
RUN mvn clean package -DskipTests -q && rm -f target/*.original

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=build --chown=appuser:appgroup /app/backend/target/*.jar app.jar

USER appuser

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-XX:+UseSerialGC", "-jar", "app.jar"]
