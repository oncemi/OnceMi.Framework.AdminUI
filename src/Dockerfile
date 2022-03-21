FROM node:16.14.2-bullseye-slim AS builder
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
ADD ["https://gitee.com/withsalt/vue-docker-deloy/raw/master/nginx.conf", "/etc/nginx/conf.d/default.conf"]