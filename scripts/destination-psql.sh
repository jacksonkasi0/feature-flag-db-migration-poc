#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to check if the user has sudo privileges
check_sudo() {
    if [[ $(id -u) -ne 0 ]]; then
        echo "This script must be run as root or with sudo privileges."
        exit 1
    fi
}

# Check for sudo/root privileges
check_sudo

# Update package list
echo "Updating package list..."
sudo apt update -y

# Install prerequisites
echo "Installing prerequisites (wget and gnupg)..."
sudo apt install -y wget gnupg

# Add PostgreSQL repository
echo "Adding PostgreSQL repository..."
wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Update package list again
echo "Updating package list to include PostgreSQL packages..."
sudo apt update -y

# Install PostgreSQL 16
echo "Installing PostgreSQL 16..."
sudo apt install -y postgresql-16 postgresql-client-16

# Verify installation
echo "Verifying PostgreSQL installation..."
if command -v psql >/dev/null 2>&1; then
    echo "PostgreSQL installed successfully!"
    psql --version
else
    echo "PostgreSQL installation failed."
fi
