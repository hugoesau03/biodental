# ---------- Etapa 1: build de la app React (CRA) ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
# El npm que trae node:20-alpine resuelve el lockfile distinto a versiones más nuevas
# (falso positivo "missing from lock file" en algunos transitive deps). Se alinea la
# versión de npm antes de "ci" para reproducir exactamente el mismo árbol que en local.
RUN npm install -g npm@10.9.0 && npm ci

COPY . .

# .env.production ya trae REACT_APP_API_URL=/api (rutas relativas, servidas por nginx)
RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
