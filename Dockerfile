FROM node:20-alpine

WORKDIR /app

COPY package.json server.js catalog-seed.json ./
COPY public ./public

ENV PORT=7000
EXPOSE 7000

CMD ["node", "server.js"]
