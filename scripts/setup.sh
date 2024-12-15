#!/bin/bash

# Install Bun
echo "Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Verify Bun installation
echo "Verifying Bun installation..."
bun --version

# Install Deno
echo "Installing Deno..."
curl -fsSL https://deno.land/install.sh | sh

# Verify Deno installation
echo "Verifying Deno installation..."
deno --version

echo "Installation completed!"
