# =========================================================
# Stage 1: Build Vite frontend
# =========================================================
FROM node:22-bookworm-slim AS client-build

WORKDIR /app/client

# Install frontend dependencies
COPY client/package.json client/package-lock.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copy frontend source
COPY client/ ./

# Frontend API URL
ENV VITE_API_URL=

# Clerk publishable key
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build frontend
RUN npm run build


# =========================================================
# Stage 2: Production Express server
# =========================================================
FROM node:22-bookworm-slim AS server

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001

# Install server dependencies
COPY server/package.json server/package-lock.json ./

RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Copy Express server
COPY server/ ./

# Put Vite build inside /app/server/client
COPY --from=client-build /app/client/dist ./client

EXPOSE 3001

USER node

# Start Express
CMD ["node", "server.js"]