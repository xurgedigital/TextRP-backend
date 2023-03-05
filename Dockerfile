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

FROM base AS production
ENV NODE_ENV=production
ENV APP_DATA=/app/data
ENV APP_HOME=/home/node/app
ENV PORT=8080
ENV HOST=0.0.0.0
COPY --chown=node:node ./package*.json ./
RUN yarn install
COPY --chown=node:node ./docker-entrypoint.sh ./
COPY --chown=node:node --from=build /home/node/app/build .
EXPOSE $PORT
ENTRYPOINT ["/home/node/app/docker-entrypoint.sh"]
CMD [ "dumb-init", "node", "server.js" ]