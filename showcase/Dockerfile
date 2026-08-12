# Build stage — always runs on amd64 (native) to avoid QEMU arm64 crashes during
# npm install. The .next/ output is pure JS and platform-agnostic.
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    (npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps) && \
    (npm install full-icu --no-save --legacy-peer-deps || npm install full-icu --no-save --legacy-peer-deps || npm install full-icu --no-save --legacy-peer-deps)

COPY . .

ARG BUILD_VERSION=dev
ENV BUILD_VERSION=${BUILD_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ICU_DATA=node_modules/full-icu

RUN npm run build && test -f .next/BUILD_ID

# Runtime stage — minimal image for the target platform.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    (npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev) && \
    (npm install full-icu --no-save --legacy-peer-deps || npm install full-icu --no-save --legacy-peer-deps || npm install full-icu --no-save --legacy-peer-deps)

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

ENV NODE_ICU_DATA=node_modules/full-icu

EXPOSE 3000

CMD ["npm", "start"]
