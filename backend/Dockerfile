FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5000
CMD ["sh","-c","node src/scripts/initDb.js || true; node src/scripts/migrateBrokerClients.js || true; node src/scripts/migrateBrokerMessages.js || true; node src/scripts/migrateBrokerServices.js || true; node src/scripts/migrateExecutiveMIS.js || true; node src/scripts/migrateAuctions.js || true; node src/scripts/migrateCertificateTypes.js || true; node src/scripts/migrateBrokerCerts.js || true; node src/scripts/migrateBrokerCommissions.js || true; node src/scripts/migrateSupplierCerts.js || true; node src/scripts/migrateListingRatings.js || true; node src/scripts/migrateListingClientName.js || true; node src/scripts/migrateSpec.js || true; node src/index.js"]
