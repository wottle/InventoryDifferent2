# Build stage — always runs on amd64 (native) to avoid QEMU arm64 OOM when
# next build invokes the SWC Rust compiler as a native arm64 binary.
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps || npm install --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

ARG BUILD_VERSION=dev
ENV BUILD_VERSION=${BUILD_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build && test -f .next/BUILD_ID

# Runtime stage — minimal image for the target platform.
# .next/ output is pure JS and platform-agnostic; only runtime deps are installed here.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3001

CMD ["npm", "start"]
