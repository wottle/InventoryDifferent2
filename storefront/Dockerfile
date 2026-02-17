FROM node:20-alpine

WORKDIR /app

# Build arguments (baked into Next.js at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
