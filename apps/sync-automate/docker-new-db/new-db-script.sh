#!/bin/bash
set -e

# Load configurations from environment variables
DB1_URL="${DB1_URL}"
DB2_URL="${DB2_URL}"
REPLICATOR_PASSWORD="${REPLICATOR_PASSWORD}"

# Parse SSL root certificates if present
SSLROOTCERT_DB1=$(echo "$DB1_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)
SSLROOTCERT_DB2=$(echo "$DB2_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)

# Adjust SSL root certificate paths
if [[ -n "$SSLROOTCERT_DB1" ]]; then
  DB1_URL="${DB1_URL/sslrootcert=$SSLROOTCERT_DB1/sslrootcert=/config/$SSLROOTCERT_DB1}"
fi
if [[ -n "$SSLROOTCERT_DB2" ]]; then
  DB2_URL="${DB2_URL/sslrootcert=$SSLROOTCERT_DB2/sslrootcert=/config/$SSLROOTCERT_DB2}"
fi

# Build subscription connection string to DB1
# Replace user and password with replicator credentials
SUBSCRIPTION_CONNECTION=$(echo "$DB1_URL" | sed 's|//.*:.*@|//replicator:'"$REPLICATOR_PASSWORD"'@|')

# Display connection strings (hide passwords)
DISPLAY_DB1_URL=$(echo "$DB1_URL" | sed 's|//.*:.*@|//****:****@|')
DISPLAY_DB2_URL=$(echo "$DB2_URL" | sed 's|//.*:.*@|//****:****@|')
DISPLAY_SUBSCRIPTION_CONNECTION=$(echo "$SUBSCRIPTION_CONNECTION" | sed 's|//.*:.*@|//replicator:****@|')

echo -e "\n🔑 Connecting to DB2 with connection string:\n$DISPLAY_DB2_URL\n"
echo -e "🔗 Subscription connection string:\n$DISPLAY_SUBSCRIPTION_CONNECTION\n"

# Set up subscription on DB2
psql "$DB2_URL" <<EOF
-- Drop existing subscription if it exists
DROP SUBSCRIPTION IF EXISTS my_sub;

-- Create new subscription to replicate from DB1
CREATE SUBSCRIPTION my_sub
CONNECTION '$SUBSCRIPTION_CONNECTION'
PUBLICATION my_pub
WITH (copy_data = true);
EOF

echo -e "\n✅ Subscription created successfully on DB2.\n"