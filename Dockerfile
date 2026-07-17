# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Supply dummy env variables to satisfy Zod validation at build time
ENV NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key-long-enough-anon-key-string
ENV SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key-long-enough-string
ENV GEMINI_API_KEY=dummy-gemini-key

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files for runner
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/proxy.ts ./proxy.ts
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/schemas ./schemas
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/supabase ./supabase
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy and set entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
