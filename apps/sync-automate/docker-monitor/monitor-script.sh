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

# Function to check subscription status
check_subscription_status() {
    psql "$DB2_URL" -t -c "
        SELECT json_build_object(
            'status', CASE
                WHEN sub.subenabled AND ss.pid IS NOT NULL THEN 'active'
                WHEN sub.subenabled THEN 'starting'
                ELSE 'inactive'
            END,
            'pid', ss.pid,
            'received_lsn', ss.received_lsn,
            'latest_end_lsn', ss.latest_end_lsn,
            'tables_ready', (
                SELECT COUNT(*)
                FROM pg_subscription_rel sr
                WHERE sr.srsubid = sub.oid
                AND sr.srsubstate = 'r'
            )
        )::text
        FROM pg_subscription sub
        LEFT JOIN pg_stat_subscription ss ON sub.subname = ss.subname
        WHERE sub.subname = 'my_sub';
    "
}

# Function to display table status
display_table_status() {
    psql "$DB2_URL" -c "
        -- Show subscription details
        SELECT subname, 
               subenabled,
               subslotname,
               subdisableonerr,
               subsynccommit
        FROM pg_subscription
        WHERE subname = 'my_sub';

        -- Show replication progress for all tables
        SELECT sr.srrelid::regclass as table_name,
               CASE 
                   WHEN sr.srsubstate = 'i' THEN 'initializing'
                   WHEN sr.srsubstate = 'r' THEN 'ready'
                   WHEN sr.srsubstate = 'd' THEN 'disabled'
                   ELSE sr.srsubstate::text
               END as state,
               sr.srsublsn as current_lsn
        FROM pg_subscription_rel sr
        JOIN pg_subscription s ON s.oid = sr.srsubid
        WHERE s.subname = 'my_sub'
        ORDER BY table_name;

        -- Show table statistics
        SELECT t.schemaname,
               t.tablename as table_name,
               pg_size_pretty(pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as table_size,
               COALESCE(s.n_live_tup, 0) as row_count,
               COALESCE(s.n_tup_ins, 0) as inserts,
               COALESCE(s.n_tup_upd, 0) as updates,
               COALESCE(s.n_tup_del, 0) as deletes,
               s.last_vacuum,
               s.last_analyze
        FROM pg_stat_user_tables s
        JOIN pg_tables t ON s.schemaname = t.schemaname AND s.relname = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY t.tablename;
    "
}

# Monitor replication status
ATTEMPTS=0
MAX_ATTEMPTS=10  # 10 attempts with 10-second intervals = 100 seconds total

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    STATUS_JSON=$(check_subscription_status | tr -d '[:space:]')

    if [ -z "$STATUS_JSON" ]; then
        echo "⚠️  Subscription 'my_sub' not found, but this might be temporary..."
        sleep 10
        ATTEMPTS=$((ATTEMPTS + 1))
        continue
    fi

    STATUS=$(echo $STATUS_JSON | jq -r '.status')
    PID=$(echo $STATUS_JSON | jq -r '.pid')
    RECEIVED_LSN=$(echo $STATUS_JSON | jq -r '.received_lsn')
    LATEST_LSN=$(echo $STATUS_JSON | jq -r '.latest_end_lsn')
    TABLES_READY=$(echo $STATUS_JSON | jq -r '.tables_ready')

    echo -e "\n📊 Replication Status Report ($(date -u '+%Y-%m-%d %H:%M:%S UTC'))"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🔄 Status: $STATUS"
    echo -e "📌 Process ID: ${PID:-None}"
    echo -e "📍 Received LSN: ${RECEIVED_LSN:-None}"
    echo -e "📍 Latest LSN: ${LATEST_LSN:-None}"
    echo -e "📚 Tables Ready: $TABLES_READY"

    if [ "$STATUS" = "active" ]; then
        echo -e "\n🎉 Replication is active and running!"
        display_table_status
        echo -e "\n✅ Monitoring complete - replication is healthy.\n"
        exit 0
    elif [ "$STATUS" = "starting" ]; then
        echo -e "\n⏳ Replication is initializing..."
    else
        echo -e "\n⚠️  Replication is inactive. Attempting to restart..."
        
        psql "$DB2_URL" <<EOF
        -- Attempt to fix by disable/enable cycle
        ALTER SUBSCRIPTION my_sub DISABLE;
        ALTER SUBSCRIPTION my_sub ENABLE;
EOF
    fi

    echo -e "\n⏳ Next check in 10 seconds... (Attempt $((ATTEMPTS + 1))/$MAX_ATTEMPTS)"
    sleep 10
    ATTEMPTS=$((ATTEMPTS + 1))
done

# If we reach here, monitoring failed but replication might still be working
echo -e "\n⚠️  Monitor script completed with warnings after $((MAX_ATTEMPTS * 10)) seconds."
echo -e "Note: Replication may still be working, this is just the monitoring script."
echo -e "\n📑 Final Status Report:"

psql "$DB2_URL" <<EOF
-- Show current subscription state
SELECT subname, subenabled 
FROM pg_subscription 
WHERE subname = 'my_sub';

-- Show table replication status
SELECT sr.srrelid::regclass as table_name,
       CASE 
           WHEN sr.srsubstate = 'r' THEN 'ready'
           WHEN sr.srsubstate = 'i' THEN 'initializing'
           ELSE sr.srsubstate::text
       END as state
FROM pg_subscription_rel sr
JOIN pg_subscription s ON s.oid = sr.srsubid
WHERE s.subname = 'my_sub'
ORDER BY table_name;
EOF

echo -e "\n💡 Tip: Replication continues even if monitoring stops."
echo -e "    To check status later, run this script again.\n"

exit 0
