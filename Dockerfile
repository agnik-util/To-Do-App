# Stage 1: Build the application using Maven with Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application
RUN mvn clean package -DskipTests

# Stage 2: Create the lightweight runtime image with Java 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built .jar file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port
EXPOSE 3030

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]