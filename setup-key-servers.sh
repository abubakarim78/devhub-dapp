#!/bin/bash

# Setup Seal Key Servers for DevHub
# This script sets up key servers in Open mode for development

echo "🚀 Setting up Seal Key Servers for DevHub..."

# Check if we're in the right directory
if [ ! -f "key-server-config.yaml" ]; then
    echo "❌ Error: key-server-config.yaml not found. Please run this script from the project root."
    exit 1
fi

# Generate master key for key server
echo "🔑 Generating master key for key server..."
cd seal
MASTER_KEY=$(cargo run --bin seal-cli genkey 2>/dev/null | grep "Master key:" | cut -d' ' -f3)
MASTER_PUBKEY=$(cargo run --bin seal-cli genkey 2>/dev/null | grep "Public key:" | cut -d' ' -f3)
cd ..

if [ -z "$MASTER_KEY" ] || [ -z "$MASTER_PUBKEY" ]; then
    echo "❌ Error: Failed to generate master key. Make sure Seal CLI is installed."
    echo "Install Seal CLI with: cargo install seal-cli"
    exit 1
fi

echo "✅ Master key generated: ${MASTER_KEY:0:20}..."
echo "✅ Public key generated: ${MASTER_PUBKEY:0:20}..."

# Set up environment variables
export MASTER_KEY
export CONFIG_PATH="key-server-config.yaml"

# Register key server on-chain
echo "📝 Registering key server on Sui testnet..."
KEY_SERVER_OBJECT_ID=$(sui client call \
    --function create_and_transfer_v1 \
    --module key_server \
    --package 0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682 \
    --args "DevHubKeyServer" "https://localhost:2024" 0 "$MASTER_PUBKEY" \
    --gas-budget 100000000 \
    2>/dev/null | grep -o '0x[a-fA-F0-9]\{64\}' | head -1)

if [ -z "$KEY_SERVER_OBJECT_ID" ]; then
    echo "❌ Error: Failed to register key server on-chain."
    echo "Make sure you have a funded Sui address and are connected to testnet."
    exit 1
fi

echo "✅ Key server registered with object ID: $KEY_SERVER_OBJECT_ID"

# Update config file with the actual key server object ID
sed -i "s/0x0000000000000000000000000000000000000000000000000000000000000000/$KEY_SERVER_OBJECT_ID/" key-server-config.yaml

echo "📋 Key server configuration updated"

# Start the key server
echo "🚀 Starting Seal key server..."
echo "Key server will be available at: http://localhost:2024"
echo "Metrics will be available at: http://localhost:9184"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Start the key server
cd seal
MASTER_KEY="$MASTER_KEY" CONFIG_PATH="../key-server-config.yaml" cargo run --bin key-server
