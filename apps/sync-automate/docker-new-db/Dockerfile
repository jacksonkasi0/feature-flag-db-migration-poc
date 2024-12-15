# Use the official PostgreSQL 16 image
FROM postgres:16

# Install necessary packages
RUN apt-get update && apt-get install -y bash

# Copy the new-db-script.sh into the container
COPY new-db-script.sh /usr/local/bin/new-db-script.sh

# Make the script executable
RUN chmod +x /usr/local/bin/new-db-script.sh

# Set the entrypoint to the script
ENTRYPOINT ["/usr/local/bin/new-db-script.sh"]
