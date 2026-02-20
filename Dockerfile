# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Copy sql-wasm.wasm into standalone output (replaces postbuild script)
RUN mkdir -p .next/standalone/node_modules/sql.js/dist && \
    cp node_modules/sql.js/dist/sql-wasm.wasm .next/standalone/node_modules/sql.js/dist/sql-wasm.wasm

# Stage 3: Production runtime
FROM node:18-alpine AS run
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy standalone build output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
