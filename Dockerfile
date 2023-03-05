ARG NODE_IMAGE=node:16.13.1-alpine

FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node
RUN mkdir tmp

FROM base AS dependencies
COPY --chown=node:node ./package*.json ./
RUN yarn install
COPY --chown=node:node . .

FROM dependencies AS build
RUN node ace build --production

FROM cloudron/base:4.0.0@sha256:31b195ed0662bdb06a6e8a5ddbedb6f191ce92e8bee04c03fb02dd4e9d0286df AS production
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production
ENV APP_DATA=/app/data
ENV APP_HOME=/home/cloudron/app
ENV PORT=8080
ENV HOST=0.0.0.0
USER cloudron
COPY --chown=cloudron:cloudron ./package*.json ./
RUN yarn install --production
COPY --chown=cloudron:cloudron ./docker-entrypoint.sh ./
COPY --chown=cloudron:cloudron --from=build /home/cloudron/app/build .
EXPOSE $PORT
USER root
ENTRYPOINT ["/home/cloudron/app/docker-entrypoint.sh"]
CMD [ "node", "server.js" ]
