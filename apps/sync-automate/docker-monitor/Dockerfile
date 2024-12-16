# Use the official PostgreSQL 16 image
FROM postgres:16

# Install necessary packages including jq
RUN apt-get update && apt-get install -y \
    bash \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Copy the monitor-script.sh into the container
COPY monitor-script.sh /usr/local/bin/monitor-script.sh

# Make the script executable
RUN chmod +x /usr/local/bin/monitor-script.sh

# Set the entrypoint to the script
ENTRYPOINT ["/usr/local/bin/monitor-script.sh"]
