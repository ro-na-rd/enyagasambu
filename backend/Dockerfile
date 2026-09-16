FROM node:24-alpine
RUN apk add --no-cache wget

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

USER appuser

EXPOSE 5000
CMD ["sh", "-c", "node src/scripts/initDb.js && node src/scripts/migrate.js --apply && node src/index.js"]
