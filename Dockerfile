FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.7 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/sdk-ts/package.json ./packages/sdk-ts/package.json
COPY packages/mcp-server/package.json ./packages/mcp-server/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts
COPY . .
RUN pnpm --filter agentguard-web build
FROM node:22-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
USER app
EXPOSE 3000
CMD ["node","apps/web/.next/standalone/server.js"]
