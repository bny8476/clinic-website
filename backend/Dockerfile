# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copy pom.xml first to cache dependencies (supports building from root or backend context)
COPY pom.xml* backend/pom.xml* ./
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src* backend/src* ./src/
RUN mvn clean package -DskipTests -q

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-XX:+UseSerialGC", "-jar", "app.jar"]
                                                                                                                                                                                                                                                                                