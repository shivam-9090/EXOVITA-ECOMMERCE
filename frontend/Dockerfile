FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_APP_VARIANT=store
ARG VITE_ADMIN_URL=http://localhost:3001/admin

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VARIANT=$VITE_APP_VARIANT
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npx vite build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
