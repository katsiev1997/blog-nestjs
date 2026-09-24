# Multi-stage build for React Router SPA (pnpm).

FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

FROM node:20-alpine AS runner

RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod

COPY --from=builder /app/build ./build

EXPOSE 5173

CMD ["pnpm", "run", "start"]
