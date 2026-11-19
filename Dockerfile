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

ENTRYPOINT ["sh", "-c", "exec java -Xms128m -Xmx230m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=48m -XX:MaxDirectMemorySize=32m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError -XX:NativeMemoryTracking=off -Djava.awt.headless=true -Dspring.profiles.active=render -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
