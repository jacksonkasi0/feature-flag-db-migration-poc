#!/bin/bash
set -e

# Load configurations from environment variables
DB1_URL="${DB1_URL}"
REPLICATOR_PASSWORD="${REPLICATOR_PASSWORD}"

# Parse SSL root certificate if present
SSLROOTCERT_DB1=$(echo "$DB1_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)

# Adjust SSL root certificate path
if [[ -n "$SSLROOTCERT_DB1" ]]; then
  DB1_URL="${DB1_URL/sslrootcert=$SSLROOTCERT_DB1/sslrootcert=/config/$SSLROOTCERT_DB1}"
fi

# Display connection string (hide password)
DISPLAY_DB1_URL=$(echo "$DB1_URL" | sed 's|//.*:.*@|//****:****@|')

echo -e "\n🔑 Connecting to DB1 with connection string:\n$DISPLAY_DB1_URL\n"

# Configure DB1 for logical replication
psql "$DB1_URL" <<EOF
-- Set required parameters for logical replication
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_replication_slots = 4;
ALTER SYSTEM SET max_wal_senders = 4;
SELECT pg_reload_conf();

-- Create replicator role if it doesn't exist
DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
      CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '$REPLICATOR_PASSWORD';
   END IF;
END
\$\$;

-- Create publication for all tables
DROP PUBLICATION IF EXISTS my_pub;
CREATE PUBLICATION my_pub FOR ALL TABLES;
EOF

echo -e "\n✅ DB1 configured for logical replication.\n"