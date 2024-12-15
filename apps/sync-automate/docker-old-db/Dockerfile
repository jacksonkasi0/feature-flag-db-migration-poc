# Use the official PostgreSQL 16 image
FROM postgres:16

# Install necessary packages
RUN apt-get update && apt-get install -y bash

# Copy the old-db-script.sh into the container
COPY old-db-script.sh /usr/local/bin/old-db-script.sh

# Make the script executable
RUN chmod +x /usr/local/bin/old-db-script.sh

# Set the entrypoint to the script
ENTRYPOINT ["/usr/local/bin/old-db-script.sh"]
