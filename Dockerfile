# Multi-stage build para optimizar el tamaño de la imagen final

# Etapa 1: Build - Compilar TypeScript
FROM node:18-alpine AS builder

# Argumentos de build
ARG NODE_ENV=production
ARG PORT=3000
ARG MONGODB_URI
ARG THE_CAT_API_KEY
ARG JWT_SECRET
ARG JWT_EXPIRES_IN=24h

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript a JavaScript
RUN npm run build

# Etapa 2: Production - Imagen final optimizada
FROM node:18-alpine AS production

# Argumentos de build para la etapa final
ARG NODE_ENV=production
ARG PORT=3000
ARG MONGODB_URI
ARG THE_CAT_API_KEY
ARG JWT_SECRET
ARG JWT_EXPIRES_IN=24h

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado desde la etapa de build
COPY --from=builder /app/dist ./dist

# Cambiar ownership de los archivos al usuario nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE $PORT

# Variables de entorno usando los argumentos
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV MONGODB_URI=$MONGODB_URI
ENV THE_CAT_API_KEY=$THE_CAT_API_KEY
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_EXPIRES_IN=$JWT_EXPIRES_IN

# Comando de inicio
CMD ["node", "dist/main.js"]