FROM node:20-alpine

# Full ICU data is required for locale-aware Intl.NumberFormat (currency symbol
# placement, decimal separators) in non-English locales. Alpine's node ships
# with small-icu (English only) by default.
RUN apk add --no-cache icu-data-full
ENV NODE_ICU_DATA=/usr/share/icu

WORKDIR /app

# Build argument for API URL (baked into Next.js rewrites at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG API_URL=http://api:4000
ENV API_URL=${API_URL}

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
