# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

WORKDIR /app/backend
RUN mvn clean package -DskipTests -q && rm -f target/*.original

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=build --chown=appuser:appgroup /app/backend/target/*.jar app.jar
USER appuser

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=50.0 -XX:+UseSerialGC -Djava.awt.headless=true -Dspring.profiles.active=render -Dserver.port=${PORT:-8080} -jar app.jar"]
