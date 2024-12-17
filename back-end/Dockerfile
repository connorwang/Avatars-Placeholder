FROM node:20-alpine

WORKDIR /app

RUN set -ex; \
    apk add --no-cache --virtual .gyp \
        # Gyp build dependencies
        python3 make g++ \
        py-setuptools \
        # Canvas build dependencies
        pixman-dev cairo-dev pango-dev pkgconfig; \
    apk del .gyp

COPY package*.json ./

RUN npm install typescript -g
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]