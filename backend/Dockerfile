FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (mejor cache de capas)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copia el resto del código del backend
COPY . .

# El backend escucha en PORT (por defecto 3000 dentro del contenedor, ver docker-compose.yml)
ENV PORT=3000
EXPOSE 3000

# Healthcheck simple contra la propia API
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/api/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
