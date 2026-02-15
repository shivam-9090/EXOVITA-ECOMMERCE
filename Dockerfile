FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl openssl-dev

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
