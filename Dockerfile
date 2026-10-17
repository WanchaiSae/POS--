FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
