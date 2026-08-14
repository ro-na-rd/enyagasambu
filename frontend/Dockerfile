FROM node:20-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY frontend/.next/standalone ./
COPY frontend/.next/static ./.next/static
COPY frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
