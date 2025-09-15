ARG NODE_VERSION=lts-alpine

# --- Builder stage ---
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package*.json ./
# Устанавливаем все зависимости, включая dev-зависимости для сборки
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

RUN npm run build

# --- Production stage ---
FROM node:${NODE_VERSION} AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
# Устанавливаем только production зависимости
RUN --mount=type=cache,target=/root/.npm npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

# --- Development stage ---
FROM node:${NODE_VERSION} AS development

WORKDIR /app

COPY package*.json ./
# RUN --mount=type=cache,target=/root/.npm npm ci --include=dev
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# --- Test stage ---
FROM development AS test

CMD ["npm", "run", "test"] 