FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js product-code.js mixed-pallets.js discord-digest.js sankhya-catalog.js sankhya-user-login.js integration-store.js setup-integracao.js reports.js monthly-report.js catalog-seed.json ./
COPY public ./public
ENV PORT=7000
EXPOSE 7000
CMD ["node", "server.js"]
