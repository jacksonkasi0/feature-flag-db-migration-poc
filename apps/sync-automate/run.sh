#!/bin/bash
set -e

# Load configurations from .env file
if [[ ! -f ".env" ]]; then
  echo "❌ Error: .env file not found!"
  exit 1
fi

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# Check if required variables are set
if [[ -z "$DB1_URL" || -z "$DB2_URL" || -z "$REPLICATOR_PASSWORD" ]]; then
  echo "❌ Error: One or more required variables are not set in the .env file."
  exit 1
fi

# Check for SSL certificates
SSLROOTCERT_DB1=$(echo "$DB1_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)
SSLROOTCERT_DB2=$(echo "$DB2_URL" | grep -o 'sslrootcert=[^&]*' | cut -d'=' -f2)

# Function to adjust DB URLs if SSL certificates are missing
adjust_db_url() {
  local db_url="$1"
  local sslrootcert="$2"
  local db_name="$3"

  if [[ -n "$sslrootcert" && ! -f "$sslrootcert" ]]; then
    echo "⚠️  Warning: SSL root certificate for $db_name ($sslrootcert) not found. Proceeding without SSL."
    db_url=$(echo "$db_url" | sed 's|sslmode=[^&]*||g' | sed 's|sslrootcert=[^&]*||g' | sed 's|&&|&|g' | sed 's|\?&|\?|g' | sed 's|\?$||')
  fi

  echo "$db_url"
}

# Adjust DB URLs if SSL certificates are missing
DB1_URL=$(adjust_db_url "$DB1_URL" "$SSLROOTCERT_DB1" "DB1")
DB2_URL=$(adjust_db_url "$DB2_URL" "$SSLROOTCERT_DB2" "DB2")

# Build Docker images
echo -e "\n🔨 Building Docker images...\n"
docker build -t old-db-sync ./docker-old-db
docker build -t new-db-sync ./docker-new-db
docker build -t monitor-sync ./docker-monitor
echo -e "\n✅ Docker images built successfully.\n"

# Run old-db-script.sh to configure DB1
echo -e "🚀 Configuring DB1 for logical replication...\n"
docker run --rm \
  --env-file .env \
  $( [[ -f "$SSLROOTCERT_DB1" ]] && echo "-v $(pwd)/$SSLROOTCERT_DB1:/config/$SSLROOTCERT_DB1" ) \
  old-db-sync
echo -e "\n✅ DB1 configured successfully.\n"

# Run new-db-script.sh to configure DB2
echo -e "🚀 Setting up subscription on DB2...\n"
docker run --rm \
  --env-file .env \
  $( [[ -f "$SSLROOTCERT_DB1" ]] && echo "-v $(pwd)/$SSLROOTCERT_DB1:/config/$SSLROOTCERT_DB1" ) \
  $( [[ -f "$SSLROOTCERT_DB2" ]] && echo "-v $(pwd)/$SSLROOTCERT_DB2:/config/$SSLROOTCERT_DB2" ) \
  new-db-sync
echo -e "\n✅ Subscription set up successfully on DB2.\n"

# Run monitor-script.sh to monitor replication status
echo -e "🔎 Monitoring replication status...\n"
docker run --rm \
  --env-file .env \
  $( [[ -f "$SSLROOTCERT_DB2" ]] && echo "-v $(pwd)/$SSLROOTCERT_DB2:/config/$SSLROOTCERT_DB2" ) \
  monitor-sync
echo -e "\n🎉 Replication synchronization complete.\n"