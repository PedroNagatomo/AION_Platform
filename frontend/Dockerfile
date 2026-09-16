# ==========================================
# STAGE 1: Build
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json e package-lock.json primeiro
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build de produção
RUN npm run build

# ==========================================
# STAGE 2: Runtime (Nginx)
# ==========================================
FROM nginx:1.25-alpine

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]