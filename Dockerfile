# Dockerfile para gestor-taller
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y lock primero para cachear instalaciones
COPY package.json package-lock.json* ./

# Instalar dependencias (producción)
RUN npm ci --omit=dev

# Copiar el resto de archivos
COPY . .

# Crear carpeta uploads
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
