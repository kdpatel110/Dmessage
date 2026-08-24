# =========================================================
# Stage 1: Build client
# =========================================================
FROM node:22-bookworm-slim AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY client/ ./

ENV VITE_API_URL=

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm run build


# =========================================================
# Stage 2: Production server
# =========================================================
FROM node:22-bookworm-slim AS server

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001

# Backend dependencies
COPY server/package.json server/package-lock.json ./

RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Backend source
COPY server/ ./

# Put the built client INSIDE server
COPY --from=client-build /app/client/dist ./client

EXPOSE 3001

USER node

CMD ["node", "server.js"]