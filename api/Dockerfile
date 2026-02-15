FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 4000

CMD ["./entrypoint.sh"]
