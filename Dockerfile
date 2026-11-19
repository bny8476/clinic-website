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
ENV MALLOC_ARENA_MAX=2
ENV MALLOC_TRIM_THRESHOLD_=131072
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java -Xms96m -Xmx200m -XX:MaxMetaspaceSize=256m -XX:ReservedCodeCacheSize=40m -XX:MaxDirectMemorySize=24m -Xss384k -XX:CICompilerCount=1 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError -Dspring.jmx.enabled=false -Djava.awt.headless=true -Dspring.profiles.active=render -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
