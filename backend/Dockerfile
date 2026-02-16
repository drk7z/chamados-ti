FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p logs uploads

EXPOSE 3001

CMD ["npm", "start"]
