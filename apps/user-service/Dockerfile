FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/apps/user-service/main.js"]