# Builds the React/Vite SPA and serves it through nginx, which also reverse-proxies
# /api -> gateway and /hubs -> eventservice. TLS is handled by host nginx/Certbot
# in the VPS deployment guide.
# Build context MUST be the repository root.
#
#   docker build -f deploy/web.Dockerfile -t volunteerhub-web .

FROM node:20-alpine AS build
WORKDIR /app
COPY BaseCore.WebClient/package.json ./
COPY BaseCore.WebClient/package-lock.json* ./
RUN npm install
COPY BaseCore.WebClient/ ./
# VITE_* values are inlined at build time. In production the hub is served same-origin.
ARG VITE_HUB_URL=/hubs/channel
ENV VITE_HUB_URL=${VITE_HUB_URL}
RUN npm run build

FROM nginx:1.27-alpine AS final
COPY deploy/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
