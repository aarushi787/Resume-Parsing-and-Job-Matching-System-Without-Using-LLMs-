# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL maintainer="Resume Matcher"
LABEL description="Rule-based Resume Parsing & Job Matching API (no LLMs)"

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/node_modules ./node_modules
COPY src/ ./src/
COPY sample-data/ ./sample-data/
COPY package.json ./

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
