# Build stage — always runs on amd64 (native) to avoid QEMU arm64 crashes during
# npm install. The .next/ output is pure JS and platform-agnostic.
FROM --platform=linux/amd64 node:20-alpine AS builder

# Full ICU data is required for locale-aware Intl.NumberFormat (currency symbol
# placement, decimal separators) in non-English locales.
RUN apk add --no-cache icu-data-full

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG API_URL=http://api:4000
ENV API_URL=${API_URL}
ARG BUILD_VERSION=dev
ENV BUILD_VERSION=${BUILD_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

RUN npm run build && test -f .next/BUILD_ID

# Runtime stage — minimal image for the target platform.
# Installs only production deps; .next/ is copied from the builder.
FROM node:20-alpine

RUN apk add --no-cache icu-data-full
ENV NODE_ICU_DATA=/usr/share/icu
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "start"]
