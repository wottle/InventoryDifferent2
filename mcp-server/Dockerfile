FROM node:20-alpine

# Install OpenSSL 3 compatibility
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3002

CMD ["node", "dist/index.js"]
