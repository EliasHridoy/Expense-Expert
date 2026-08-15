FROM node:20-bullseye-slim

WORKDIR /app

COPY package.json tsconfig.json app.json babel.config.js metro.config.js tailwind.config.js ./
COPY app ./app
COPY components ./components
COPY src ./src
COPY tests ./tests
COPY types ./types
COPY workspace ./workspace

RUN npm install

EXPOSE 8081

CMD ["npm", "run", "web"]
