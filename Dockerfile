FROM --platform=linux/amd64 node:21-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV production
EXPOSE 53
CMD [ "npm", "start" ]
