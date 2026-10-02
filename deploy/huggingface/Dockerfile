# Public, restricted instance for Hugging Face Spaces (Docker SDK).
# MINEIRO_PUBLIC=1: strict rate limits, no server-held Gemini key, no persistence, no avatar fetching.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=7860 MINEIRO_PUBLIC=1 MINEIRO_TRUST_PROXY=1
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY registry ./registry
USER node
EXPOSE 7860
CMD ["node", "dist/server.cjs"]
