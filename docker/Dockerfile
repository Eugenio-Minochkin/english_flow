FROM node:22.23.4-alpine3.23 AS deps
RUN apk add --no-cache 'ca-certificates-bundle>=20261020-r0'
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22.23.4-alpine3.23 AS build
RUN apk add --no-cache 'ca-certificates-bundle>=20261020-r0'
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate && npm run build

FROM node:22.23.4-alpine3.23
RUN apk add --no-cache 'ca-certificates-bundle>=20261020-r0'
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
CMD ["node", "dist/src/main.js"]
