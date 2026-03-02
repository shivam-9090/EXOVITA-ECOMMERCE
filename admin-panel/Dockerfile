FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api

ENV VITE_API_URL=$VITE_API_URL

# Copy package files and install deps from frontend folder
COPY package.json ./
RUN npm install

# Copy full frontend source
COPY . .

# Build admin panel using the admin vite config
RUN npx vite build --config vite.admin.config.ts --outDir admin-dist

# Rename entry to index.html so serve can find it
RUN mv /app/admin-dist/index.admin.html /app/admin-dist/index.html

# --- Runtime stage ---
FROM node:20-alpine AS runtime

RUN npm install -g serve

COPY --from=build /app/admin-dist /app/dist

EXPOSE 3002

CMD ["serve", "-s", "/app/dist", "-l", "3002"]
