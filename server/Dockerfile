FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3500

EXPOSE 3500

CMD [ "npm", "start" ]
