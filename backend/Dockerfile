# ==========================================
# STAGE 1: Build
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copiar pom.xml primeiro (para cache de dependências)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fonte
COPY src ./src

# Buildar o JAR
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -S spring && adduser -S spring -G spring

# Copiar o JAR do stage anterior
COPY --from=build /app/target/*.jar app.jar

# Mudar para o usuário não-root
USER spring:spring

# Expor a porta
EXPOSE 8080

# Configurar JVM para containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Executar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]