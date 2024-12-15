#!/bin/bash
set -e

# Load configurations from environment variables
DB2_URL="${DB2_URL}"

# Parse SSL root certificate if present
SSLROOTCERT_DB2=$(echo "$DB2_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)

# Adjust SSL root certificate path
if [[ -n "$SSLROOTCERT_DB2" ]]; then
  DB2_URL="${DB2_URL/sslrootcert=$SSLROOTCERT_DB2/sslrootcert=/config/$SSLROOTCERT_DB2}"
fi

# Display connection string (hide password)
DISPLAY_DB2_URL=$(echo "$DB2_URL" | sed 's|//.*:.*@|//****:****@|')

echo -e "\n🔑 Monitoring DB2 with connection string:\n$DISPLAY_DB2_URL\n"

# Monitor replication status
while true; do
  STATUS=$(psql "$DB2_URL" -c "
    SELECT
      CASE
        WHEN column_name = 'state' THEN (SELECT state FROM pg_stat_subscription WHERE subname = 'my_sub')
        WHEN column_name = 'status' THEN (SELECT status FROM pg_stat_subscription WHERE subname = 'my_sub')
        ELSE 'unknown'
      END AS replication_status
    FROM information_schema.columns
    WHERE table_name = 'pg_stat_subscription' AND column_name IN ('state', 'status')
    LIMIT 1;
  " -t | tr -d '[:space:]')
  
  if [[ -z "$STATUS" ]]; then
    echo -e "❌ Could not retrieve replication status."
    exit 1
  fi
  
  echo -e "🔄 Subscription status: $STATUS"
  
  if [[ "$STATUS" == "streaming" || "$STATUS" == "active" ]]; then
    echo -e "\n🎉 Replication is fully synchronized.\n"
    break
  else
    echo -e "⏳ Waiting for replication to catch up...\n"
    sleep 10
  fi
done