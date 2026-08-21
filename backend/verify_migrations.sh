#!/bin/bash
set -e

echo "Dropping and recreating clinic_test database..."
psql -d postgres -c "DROP DATABASE IF EXISTS clinic_test;"
psql -d postgres -c "CREATE DATABASE clinic_test;"

echo "Running Flyway migrations..."
cd backend
mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/clinic_test -Dflyway.user=$(whoami) -Dflyway.locations=classpath:db/migration/clinic -Dflyway.cleanDisabled=false

echo "Running Flyway validation..."
mvn flyway:validate -Dflyway.url=jdbc:postgresql://localhost:5432/clinic_test -Dflyway.user=$(whoami) -Dflyway.locations=classpath:db/migration/clinic

echo "Migrations successfully verified!"
