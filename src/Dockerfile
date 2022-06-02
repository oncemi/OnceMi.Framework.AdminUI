FROM node:16-alpine AS builder
WORKDIR /app

COPY . /app

RUN npm config set registry https://registry.npm.taobao.org
RUN npm install
RUN npm run build

FROM nginx:latest
EXPOSE 80
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .
RUN chmod -R a+rx *

# Donwload nginx.conf from url
ADD ["https://raw.githubusercontent.com/oncemi/OnceMi.Framework.AdminUI/main/docs/docker/nginx/nginx.conf", "/etc/nginx/conf.d/default.conf"]