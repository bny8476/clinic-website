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

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

COPY --from=build --chown=appuser:appgroup /app/backend/target/*.jar app.jar

USER appuser

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec java -XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Djava.awt.headless=true -Dspring.profiles.active=render -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
