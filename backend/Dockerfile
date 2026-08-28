FROM node:20-alpine
RUN apk add --no-cache wget

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000
CMD ["sh","-c","node src/scripts/initDb.js; node src/scripts/migrateBrokerClients.js 2>/dev/null; node src/scripts/migrateBrokerMessages.js 2>/dev/null; node src/scripts/migrateBrokerServices.js 2>/dev/null; node src/scripts/migrateExecutiveMIS.js 2>/dev/null; node src/scripts/migrateAuctions.js 2>/dev/null; node src/scripts/migrateCertificateTypes.js 2>/dev/null; node src/scripts/migrateBrokerCerts.js 2>/dev/null; node src/scripts/migrateBrokerCommissions.js 2>/dev/null; node src/scripts/migrateSupplierCerts.js 2>/dev/null; node src/scripts/migrateListingRatings.js 2>/dev/null; node src/scripts/migrateListingClientName.js 2>/dev/null; node src/scripts/migrateSpec.js 2>/dev/null; node src/index.js"]
