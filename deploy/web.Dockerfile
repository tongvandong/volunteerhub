# Builds the React/Vite SPA and serves it through Caddy, which also reverse-proxies
# /api -> gateway and /hubs -> eventservice (with automatic websocket upgrade + optional HTTPS).
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

FROM caddy:2-alpine AS final
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
