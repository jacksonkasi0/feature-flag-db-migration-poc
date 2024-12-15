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
  # Get subscription status using pg_subscription
  STATUS=$(psql "$DB2_URL" -t -c "
    SELECT CASE 
      WHEN s.subenabled AND EXISTS (
        SELECT 1 
        FROM pg_replication_slots rs 
        WHERE rs.slot_name = 'my_sub' 
        AND rs.active = true
      ) THEN 'active'
      ELSE 'inactive'
    END as status
    FROM pg_subscription s 
    WHERE s.subname = 'my_sub';
  " | tr -d '[:space:]')

  if [[ -z "$STATUS" ]]; then
    # If no status returned, check if subscription exists
    SUB_EXISTS=$(psql "$DB2_URL" -t -c "
      SELECT COUNT(*) 
      FROM pg_subscription 
      WHERE subname = 'my_sub';
    " | tr -d '[:space:]')

    if [[ "$SUB_EXISTS" == "0" ]]; then
      echo -e "❌ Subscription 'my_sub' does not exist."
      exit 1
    else
      echo -e "❌ Could not retrieve replication status."
      exit 1
    fi
  fi

  echo -e "🔄 Subscription status: $STATUS"

  if [[ "$STATUS" == "active" ]]; then
    # Check if data is being replicated by comparing row counts
    OLD_COUNT=$(psql "$DB2_URL" -t -c "
      SELECT COUNT(*) FROM (
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      ) t;
    " | tr -d '[:space:]')

    sleep 5  # Wait for 5 seconds

    NEW_COUNT=$(psql "$DB2_URL" -t -c "
      SELECT COUNT(*) FROM (
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      ) t;
    " | tr -d '[:space:]')

    if [[ "$OLD_COUNT" != "0" && "$OLD_COUNT" == "$NEW_COUNT" ]]; then
      echo -e "\n🎉 Replication is fully synchronized.\n"
      
      # Print table statistics
      echo -e "📊 Table Statistics:"
      psql "$DB2_URL" -c "
        SELECT 
          schemaname,
          tablename,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      "
      break
    fi

    echo -e "⏳ Data is still being copied..."
  else
    echo -e "⏳ Waiting for replication to become active...\n"
    sleep 10
  fi
done

# Final verification of replication setup
echo -e "\n🔍 Verifying replication setup..."

echo -e "\n📋 Subscription Details:"
psql "$DB2_URL" -c "
SELECT 
  subname,
  subenabled,
  subconninfo,
  subslotname,
  subsynccommit
FROM pg_subscription
WHERE subname = 'my_sub';
"

echo -e "\n🔄 Replication Slot Status:"
psql "$DB2_URL" -c "
SELECT 
  slot_name,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots
WHERE slot_name = 'my_sub';
"

echo -e "\n✅ Monitoring complete.\n"