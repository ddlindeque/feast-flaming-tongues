# Feast page. Inside the container the process listens on 0.0.0.0:4173.
# compose.yaml publishes that only on the host loopback, for the Cloudflare tunnel.

FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4173

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node public ./public

USER node

EXPOSE 4173

CMD ["node", "dist/server.js"]
