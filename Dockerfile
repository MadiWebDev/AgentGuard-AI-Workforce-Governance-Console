FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.7 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/sdk-ts/package.json ./packages/sdk-ts/package.json
COPY packages/mcp-server/package.json ./packages/mcp-server/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm --filter agentguard-web build
FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
# Next standalone output in this monorepo lands at .next/standalone/apps/web/server.js
# (workspace-root-relative), so copy the whole standalone tree to /app.
COPY --from=base --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=base --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base --chown=app:app /app/apps/web/public ./apps/web/public
USER app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
