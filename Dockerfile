FROM node:22-alpine

WORKDIR /app

COPY package.json serve.js index.html ./
COPY css ./css
COPY js ./js

ENV PORT=8080
EXPOSE 8080

CMD ["node", "serve.js"]
