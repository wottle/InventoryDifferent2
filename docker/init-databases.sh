#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE umami;
    GRANT ALL PRIVILEGES ON DATABASE umami TO $POSTGRES_USER;
EOSQL
