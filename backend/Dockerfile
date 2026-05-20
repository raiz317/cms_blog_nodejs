FROM registry.access.redhat.com/ubi8/nodejs-18:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]
