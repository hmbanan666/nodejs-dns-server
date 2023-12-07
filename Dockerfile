# Build Stage
FROM --platform=linux/amd64 node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci

# Production Stage
FROM --platform=linux/amd64 node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV production
ARG EXPOSED_PORT=53
EXPOSE $EXPOSED_PORT
CMD [ "npm", "start" ]
