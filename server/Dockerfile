FROM node:14.15-alpine3.12 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:14.15-alpine3.12

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production --no-audit --no-fund

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3001
CMD ["node", "dist/main.js"]
