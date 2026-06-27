FROM node:20

ARG BUILD_VERSION=dev
ENV BUILD_VERSION=${BUILD_VERSION}

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 4000

CMD ["./entrypoint.sh"]
