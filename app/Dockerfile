FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install prom-client
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
