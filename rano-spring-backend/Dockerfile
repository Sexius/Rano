# 1. 빌드 환경 설정
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# 2. 실행 환경 설정 (여기를 더 안정적인 버전으로 교체함)
FROM eclipse-temurin:17-jdk-jammy
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]