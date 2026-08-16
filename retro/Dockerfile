FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
EXPOSE 3004
CMD ["node", "src/index.js"]
