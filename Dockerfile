FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js product-code.js reports.js monthly-report.js catalog-seed.json ./
COPY public ./public
ENV PORT=7000
EXPOSE 7000
CMD ["node", "server.js"]
