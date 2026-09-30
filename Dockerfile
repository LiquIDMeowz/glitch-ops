# Wiki image: the login server plus the built site. Build from the repo root after the site was
# built with the private content (CI: `pnpm build` in site/ with CONTENT_DIR set) — the pages are
# baked into this image, which only lives in the CMEK Artifact Registry repo.
FROM node:24-slim AS deps
WORKDIR /app
COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY site/dist ./site
USER node
EXPOSE 8080
CMD ["node", "src/index.ts"]
