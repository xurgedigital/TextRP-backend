#!/bin/bash

set -eu


echo "==> Ensure permissions"
mkdir -p /app/data
chown -R cloudron:cloudron /app/data

if [[ ! -f "$APP_HOME/.env" ]]; then
    echo "==> Linking .env on first run"
    if [[ ! -f "$APP_HOME/.storage_setup" ]]; then
        echo "==> Touch env file"
        touch $APP_DATA/env
        touch "$APP_DATA/.storage_setup"
    fi
    ln -s $APP_DATA/env $APP_HOME/.env
fi

echo "==> Update env variables"

export QUEUE_REDIS_HOST=${CLOUDRON_REDIS_HOST:-localhost}
export QUEUE_REDIS_PORT=${CLOUDRON_REDIS_PORT:-6379}
export QUEUE_REDIS_PASSWORD=${CLOUDRON_REDIS_PASSWORD:-}

export REDIS_HOST=${CLOUDRON_REDIS_HOST:-localhost}
export REDIS_PORT=${CLOUDRON_REDIS_PORT:-6379}
export REDIS_PASSWORD=${CLOUDRON_REDIS_PASSWORD:-}

export SMTP_HOST=${CLOUDRON_MAIL_SMTP_SERVER:-localhost}
export SMTP_PORT=${CLOUDRON_MAIL_SMTPS_PORT:-6379}
export SMTP_USERNAME=${CLOUDRON_MAIL_SMTP_USERNAME:-}
export SMTP_PASSWORD=${CLOUDRON_MAIL_SMTP_PASSWORD:-}

export DB_CONNECTION=pg
export PG_HOST=${CLOUDRON_POSTGRESQL_HOST:-}
export PG_PORT=${CLOUDRON_POSTGRESQL_PORT:-}
export PG_USER=${CLOUDRON_POSTGRESQL_USERNAME:-}
export PG_PASSWORD=${CLOUDRON_POSTGRESQL_PASSWORD:-}
export PG_DB_NAME=${CLOUDRON_POSTGRESQL_DATABASE:-}


echo "==> Migrating App"
/usr/local/bin/gosu cloudron:cloudron node ace migration:run --force
echo "==> Starting App"

exec /usr/local/bin/gosu cloudron:cloudron "$@"
