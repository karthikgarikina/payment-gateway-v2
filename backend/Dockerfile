FROM node:18-slim

WORKDIR /app

# 🔴 REQUIRED for Prisma
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
