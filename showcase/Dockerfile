FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN npm install full-icu --no-save --legacy-peer-deps

COPY . .

ENV NODE_ICU_DATA=node_modules/full-icu

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
